import networkx as nx
import numpy as np


def spring(graph: nx.DiGraph, iterations=10, scale=1000):
    """Calculate a spring layout and appends a "pos" attribute to the graph
    containing the node positions."""
    pos = nx.spring_layout(graph, scale=scale, iterations=iterations)
    _set_pos_node_attribute(graph, pos)


def spectral(graph: nx.DiGraph, scale=1000):
    """Calculates a spectral layout and appends a "pos" attribute to the graph
    containing the node positions."""
    pos = nx.spectral_layout(graph, scale=scale, dim=2, weight=None, center=[0, 0])
    _set_pos_node_attribute(graph, pos)


def circular(graph: nx.DiGraph, scale=1000):
    """Calculates a circular layout and appends a "pos" attribute to the graph
    containing the node positions."""
    pos = nx.circular_layout(graph, scale=scale, center=[0, 0])
    _set_pos_node_attribute(graph, pos)


def star(graph: nx.DiGraph):
    """Calculates a star layout (with the first node being the central node)
    and appends a "pos" attribute to the graph containing the node positions."""
    center = np.zeros(2)

    if len(graph) == 0:
        pos = {}
    elif len(graph) == 1:
        pos = {graph.nodes[0]: center}
    else:
        theta = np.linspace(0, 1, len(graph) + 1, endpoint=False)[1:] * 2 * np.pi
        theta = theta.astype(np.float32)
        pos = np.column_stack([np.cos(theta), np.sin(theta)])
        pos = nx.rescale_layout(pos, scale=10 * len(graph))
        pos[0] = center
        pos = dict(zip(graph, pos))

    _set_pos_node_attribute(graph, pos)


def _set_pos_node_attribute(graph, pos):
    for n, coords in pos.items():
        x, y = coords.tolist()
        graph.nodes[n]["x"] = x
        graph.nodes[n]["y"] = y
