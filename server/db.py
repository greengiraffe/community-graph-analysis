from typing import List, OrderedDict
import asyncio
import json
import os
from dotenv import load_dotenv
import asyncpg
import networkx as nx
import numpy

import graph_layout


# Load DB connection data from .env
load_dotenv()
DB_URI = os.getenv("DB_URI")

# global asyncpg connection
conn_pool: asyncpg.Pool = None


async def connect(loop: asyncio.AbstractEventLoop = None):
    """Connect to DB and setup connection pool"""
    global conn_pool
    conn_pool = await asyncpg.pool.create_pool(
        dsn=DB_URI, min_size=1, max_size=5, init=init_connection, loop=loop
    )


async def init_connection(conn_pool):
    """Adds a JSON encoder and decoder for Postgres' JSON data type."""

    await conn_pool.set_type_codec(
        "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )


async def disconnect():
    """Close connections to DB"""

    if conn_pool is None:
        return
    try:
        await asyncio.wait_for(conn_pool.close(), timeout=5)
    except TimeoutError:
        conn_pool.terminate()


async def answerer_graph(
    answer_threshold=30, selfloops=False, largest_subgraph_only=False
):
    """ "Fetches the answerer graph from the database and constructs a
    dict from the graph data that contains the graph as well as many
    metrics calculated from the graph data. The dict is ready to be
    served as JSON. Raises a ValueError if any argument is of wrong type."""

    if not (
        isinstance(answer_threshold, int)
        and isinstance(selfloops, bool)
        and isinstance(largest_subgraph_only, bool)
    ):
        raise ValueError("Wrong argument type provided")

    data = await conn_pool.fetch(
        f"""
            SELECT
            poster_name as target_label,
            answerer_name as source_label,
            poster as target_id,
            answerer as source_id,
            weight
            FROM answerer_graph e
            WHERE weight >= {answer_threshold}
            {';' if selfloops else 'AND poster != answerer'}
        """
    )

    graph = graph_from_records(data)
    add_reciprocal_edge_data(graph)
    if largest_subgraph_only:
        graph = graph.subgraph(max(nx.weakly_connected_components(graph), key=len))

    json = graph_to_json(graph)
    add_statistics(json, graph)
    add_centralities(json, graph)
    add_communities(json, graph)

    json["options"] = {
        "selfloops": selfloops,
        "answerThreshold": answer_threshold,
        "largestSubgraphOnly": largest_subgraph_only,
    }

    return json


async def departments_graph():
    """ "Fetches the common departments graph from the database and constructs a
    dict from the graph data that contains the graph as well as many
    metrics calculated from the graph data. The dict is ready to be
    served as JSON."""

    data = await conn_pool.fetch(
        """
            SELECT
            dep1 as source_id,
            dep2 as target_id,
            weight
            FROM departments_graph
            ORDER BY dep1 asc, dep2 asc, weight desc
        """
    )

    graph = graph_from_records(data)
    # add_graph_layout(graph, "circular", scale=700)

    json = graph_to_json(graph)
    add_matrix(json, graph)
    add_statistics(json, graph)

    return json


async def user_data(user_id):
    """Returns a JSON-ready dict containing several statistics
    for the given user. Raises a ValueError if user_id is not a number."""

    if not isinstance(user_id, int):
        raise ValueError("user_id must be a number")

    [time_heatmap, week_histogram, user_stats, departments] = await asyncio.gather(
        conn_pool.fetch(
            f"""
                SELECT * FROM post_time_heatmap({user_id})
            """
        ),
        conn_pool.fetchrow(
            f"""
                SELECT * FROM post_weekday_histogram({user_id})
            """
        ),
        conn_pool.fetchrow(
            f"""
                SELECT * FROM user_stats WHERE user_id = {user_id}
            """
        ),
        conn_pool.fetch(
            """
                SELECT DISTINCT target as dep FROM department_mapping
            """
        ),
    )

    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    # process heatmap
    heatmap = numpy.zeros((24, 7), dtype=int)
    for row in time_heatmap:
        hour = row["hour"]
        for i, val in enumerate(row.values()):
            # skip hour column
            if i == 0:
                continue
            heatmap[hour, i - 1] = val

    heatmap = heatmap.transpose()
    hours = [str(h) for h in range(24)]
    heatmap_result = []
    for i, day in enumerate(day_names):
        hour_map = dict(zip(hours, map(str, heatmap[i])))
        heatmap_result.append(OrderedDict(day=day, **hour_map))

    for row in time_heatmap:
        for day, val in enumerate(row.values()):
            if day == 0:
                continue  # skip hour column
            heatmap_result[day - 1][hour] = val

    # process histogram
    hist_result = []
    for day in day_names:
        hist_result.append(dict(id=day, value=week_histogram[day]))

    # add missing departments
    user_deps_stats: List = user_stats["departments"]
    user_deps = list(map(lambda x: x["dep"], user_stats["departments"]))
    for dep_record in departments:
        dep = dep_record["dep"]
        if dep not in user_deps:
            user_deps_stats.append({"dep": dep, "count": 0})

    user_deps_stats.sort(key=lambda x: x["dep"])

    json = {
        "id": user_id,
        "randomName": user_stats["random_name"],
        "firstPostDate": user_stats["first_post_date"].isoformat(),
        "lastPostDate": user_stats["last_post_date"].isoformat(),
        "commentStats": {
            "total": user_stats["count_total"],
            "answersGiven": user_stats["count_replies_to_others"],
            "answersReceived": user_stats["count_replies_from_others"],
            "answersToSelf": user_stats["count_replies_from_self"],
            "topLevel": user_stats["count_top_level"],
            "notPublished": user_stats["count_not_published"],
            "notVisible": user_stats["count_not_visible"],
            "avgLength": user_stats["avg_comment_length"],
            "avgWords": user_stats["avg_comment_word_count"],
        },
        "departments": user_deps_stats,
        "timeHeatmap": heatmap_result,
        "weekHistogram": hist_result,
    }

    return json


def graph_from_records(records: List[asyncpg.Record]):
    """Construct a networkX graph from a list of asyncpg database records.
    The records require the following fields: source_id, target_id.
    These fields are optional: source_label, target_label, weight"""

    graph = nx.DiGraph()
    for r in records:
        try:
            source_label = r["source_label"]
            target_label = r["target_label"]
        except Exception:
            source_label = r["target_id"]
            target_label = r["target_id"]

        graph.add_node(r["source_id"], label=source_label)
        graph.add_node(r["target_id"], label=target_label)
        graph.add_edge(r["source_id"], r["target_id"], weight=r["weight"])
    return graph


def graph_to_json(graph: nx.DiGraph):
    """Transforms the networkX graph to a json representation
    that uses a vis-network friendly format"""

    json = nx.node_link_data(graph)

    # Remove unneeded keys
    json.pop("directed", None)
    json.pop("graph", None)
    json.pop("multigraph", None)

    for n in json["nodes"]:
        if n["label"] is None:
            n["label"] = n["id"]

    # rename edge attributes for vis-network
    for e in json["links"]:
        e["from"] = e.pop("source")
        e["to"] = e.pop("target")
        e["value"] = e.pop("weight")

    return json


def add_reciprocal_edge_data(graph: nx.DiGraph):
    """Adds the attributes `reciprocal`, `reciprocal_weight_sum` and
    `reciprocal_weight_ratio` to all reciprocal edges."""

    for u, v, d in graph.edges(data=True):
        if graph.has_edge(v, u):
            weight_uv = d["weight"]
            weight_vu = graph.get_edge_data(v, u)["weight"]
            weight_sum = weight_uv + weight_vu
            # weight_ratio = 0
            # if weight_uv > weight_vu:
            #     weight_ratio = weight_uv / weight_vu
            # else:
            #     weight_ratio = weight_vu / weight_uv
            edge_uv = graph[u][v]
            edge_vu = graph[v][u]

            edge_uv["reciprocal"] = True
            edge_uv["reciprocal_weight_sum"] = weight_sum
            edge_uv["reciprocal_weight_ratio"] = round(weight_uv / weight_vu, 2)

            edge_vu["reciprocal"] = True
            edge_vu["reciprocal_weight_sum"] = weight_sum
            edge_vu["reciprocal_weight_ratio"] = round(weight_vu / weight_uv, 2)


def add_statistics(json, graph: nx.DiGraph):
    """Adds several graph statistics to the JSON dict, such as
    node and edge count, reciprocity metric, number of selfloops etc."""

    json["stats"] = {
        "reciprocity": round(nx.overall_reciprocity(graph) * 100, 2),
        "is_directed": nx.is_directed(graph),
        "is_weighted": nx.is_weighted(graph),
        "node_count": nx.number_of_nodes(graph),
        "edge_count": nx.number_of_edges(graph),
        "selfloop_count": nx.number_of_selfloops(graph),
    }

    if nx.is_weighted(graph):
        weights = [e[2] for e in graph.edges.data("weight")]
        avg_weight = sum(weights) / len(weights)
        json["stats"]["min_weight"] = min(weights)
        json["stats"]["max_weight"] = max(weights)
        json["stats"]["avg_weight"] = round(avg_weight, 2)

    reciprocal_weight_ratios = [
        e[2] for e in graph.edges.data("reciprocal_weight_ratio") if e[2] is not None
    ]
    if len(reciprocal_weight_ratios) > 0:
        json["stats"]["min_reciprocal_ratio"] = min(reciprocal_weight_ratios)
        json["stats"]["max_reciprocal_ratio"] = max(reciprocal_weight_ratios)


def add_graph_layout(graph: nx.DiGraph, layout, iterations=100, **kwargs):
    """Calculates a layout of the graph and adds positions to all nodes as
    a node attribute `pos`."""

    if layout == "fa2":
        graph_layout.fa2(graph, iterations)
    elif layout == "spring":
        graph_layout.spring(graph, iterations)
    elif layout == "spectral":
        graph_layout.spectral(graph)
    elif layout == "circular":
        graph_layout.circular(graph, **kwargs)
    elif layout == "star":
        graph_layout.star(graph, **kwargs)


def add_centralities(json, graph: nx.DiGraph):
    """Adds several centrality measurements to the JSON dict. They
    are added as the `centrality` property that holds a dict/JSON object
    for every centrality metric, e.g. `degree` or `eigenvector`."""

    c_deg = nx.degree_centrality(graph)
    c_deg_in = nx.in_degree_centrality(graph)
    c_deg_out = nx.out_degree_centrality(graph)
    c_btwn = nx.betweenness_centrality(graph)
    c_close = nx.closeness_centrality(graph)

    # computes in-edges eigenv. centrality, use
    # graph.reverse() for out-edges centrality
    # Use the numpy variant as the non-numpy version does not
    # always return (it raises a PowerIterationFailedConvergence exception)
    c_eigen = nx.eigenvector_centrality_numpy(graph)
    c_harmonic = nx.harmonic_centrality(graph)
    c_pagerank = nx.pagerank(graph)

    json["centrality"] = {
        "degree": {
            "values": c_deg,
            "min": min(c_deg.values()),
            "max": max(c_deg.values()),
        },
        "in-degree": {
            "values": c_deg_in,
            "min": min(c_deg_in.values()),
            "max": max(c_deg_in.values()),
        },
        "out-degree": {
            "values": c_deg_out,
            "min": min(c_deg_out.values()),
            "max": max(c_deg_out.values()),
        },
        "betweenness": {
            "values": c_btwn,
            "min": min(c_btwn.values()),
            "max": max(c_btwn.values()),
        },
        "closeness": {
            "values": c_close,
            "min": min(c_close.values()),
            "max": max(c_close.values()),
        },
        "eigenvector": {
            "values": c_eigen,
            "min": min(c_eigen.values()),
            "max": max(c_eigen.values()),
        },
        "harmonic": {
            "values": c_harmonic,
            "min": min(c_harmonic.values()),
            "max": max(c_harmonic.values()),
        },
        "pagerank": {
            "values": c_pagerank,
            "min": min(c_pagerank.values()),
            "max": max(c_pagerank.values()),
        },
    }


def add_communities(json, graph: nx.DiGraph):
    """Adds community analysis metrics to the JSON dict under the
    `community` property."""

    import networkx.algorithms.community as nxc

    label_propagation = nxc.asyn_lpa_communities(graph)
    modularity = nxc.greedy_modularity_communities(graph.to_undirected())

    json["community"] = {
        "labelPropagation": sorted(
            [list(set) for set in list(label_propagation)], key=len
        ),
        "modularity": sorted([list(set) for set in list(modularity)], key=len),
        "cliques": get_cliques(graph),
    }


def get_cliques(graph: nx.DiGraph):
    """Returns a list of cliques of at least size 2 for the given graph.
    The DiGraph is converted to an undirected graph by only keeping the
    reciprocal edges."""

    # construct an undirected graph from all reciprocal
    # edges of the original DiGraph
    reciprocal_graph = graph.to_undirected(reciprocal=True)

    # compute all cliques
    cliques = nx.find_cliques(reciprocal_graph)

    # keep only cliques that consist of at least 2 nodes
    cliques_larger_2 = [clq for clq in cliques if len(clq) >= 2]

    return sorted(cliques_larger_2, key=len)


def add_matrix(json, graph: nx.DiGraph):
    """Adds an adjacency matrix of the graph to the JSON dict."""

    matrix = nx.to_numpy_matrix(graph)
    # matrix.sort()
    json["matrix"] = matrix.tolist()
