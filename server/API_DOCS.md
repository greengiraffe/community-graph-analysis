# API Documentation

## Get Answerer Graph

Retrieve the Answerer Graph.

**URL:** `/answerer-graph`

**Method:** `GET`

**Query Parameters:**

All query parameters are required.

| Parameter | Type | Description
|---|---|---|
| `answerThreshold` | Number (> 0) | The minimum edge weight for this graph |
| `selfloops` | Number (0 or 1) | Whether to include selfloops or not |
| `largestSubgraphOnly` | Number (0 or 1) | Whether to only get the largest connected subgraph |


### Success Response

**Code:** `200 OK`

**Example return value:**

A JSON object is returned that includes all graph data, statistics and measurements such as centrality metrics or cliques.

```jsonc
{
    // NetworkX nodes array
    "nodes": [
        { "label": "MartinK", "id": "123456" },
        { "label": "AnjaS", "id": "654321" },
        // ...
    ],
    
    // NetworkX links array
    "links": [ 
        { "from": "123456", "to": "654321", "value": 103 },
        { "from": "654321", "to": "123456", "value": 57 },
        // ...
    ],

    // Options set via query parameters when fetching the graph
    "options": {
        "selfloops": false,
        "answer_threshold": 50,
        "largest_subgraph_only": false
    },
    
    // Graph statistics
    "stats":{
        "min_weight": 50,     // minimum edge weight
        "max_weight": 1545,   // maximum edge weight
        "avg_weight": 104.05, // average edge weight
        "reciprocity": 65.78, // graph reciprocity
        "is_directed": true,  // is the graph directed?
        "is_weighted": true,  // is the graph weighted?
        "min_reciprocal_ratio": 0.14, // min. reciprocal edge weight ratio
        "max_reciprocal_ratio": 7.05, // max. reciprocal edge weight ratio
        "node_count": 611,    // number of nodes in the graph
        "edge_count": 1347,   // number of edges in the graph
        "selfloop_count": 0   // number of selfloops in the graph
    },
    
    // Object that includes several centrality measures, all
    // following the same schema as shown in "degree" 
    "centrality": {
        "degree": {
            "min": 0.001123,      // min. value for this centrality
            "max": 0.213221,      // max. value for this centrality
            "values": {
                "123456": 0.123553, // centrality values for each node
                "654321": 0.251678,
                // ...
            }
        },
        "betweenness": {
            //...
        },
      // and more centralities
    }

    // Object containing community sets based on different community
    // detection algorithms. For each method nested arrays of node IDs
    // are provided, each inner array representing a detected community
    // or clique.
    "community": {
        "cliques": [
            ["123456", "654321"],
            ["231298", "435879", "123456"],
            // ...
        ],
        
        "label_propagation": [  
            ["231298", "435879", "234522", "123456"],
            // ...
        ],
        
        "modularity": [
            ["123456", "654321", "234522"],
            // ...
        ]
    }
}
```

### Error Response

**Code:** `400 Bad Request`

When any arguments are missing or of the wrong type.


## Departments Graph

Retrieve the Department Siblings Graph.

**URL:** `/department-graph`

**Method:** `GET`

**Query Parameters:** None

### Success Response

**Code:** `200 OK`

**Example return value:**

A JSON object is returned that includes all graph data, statistics and an adjacency matrix representation of the graph.

```jsonc
{
  // NetworkX nodes array, similar to /answerer-graph
  "nodes": [],

  // NetworkX links array, similar to /answerer-graph
  "links": [],

  // Graph statistics object, similar to /answerer-graph
  "stats": {},

  // Adjacency matrix of the graph data as nested arrays 
  "matrix": []
```

## User Data

Retrieve user data and statistics.

**URL:** `/user`

**Method:** `GET`

**Query Parameters:**

All query parameters are required.

| Parameter | Type | Description
|---|---|---|
| `userId` | Number | The user ID |


### Success Response

**Code:** `200 OK`

**Example return value:**

A JSON object containing information about the requested user.

```jsonc
{
    "id": "123456",           // the user ID
    "randomName": "MartinK",  // the user alias
    "firstPostDate": "2018-01-01T13:30:00+00:00", // ISO timestamp of the user's first post
    "lastPostDate": "2020-10-05T18:12:00+00:00", // ISO timestamp of the user's last post
    
    // Statistics about the users comments
    "commentStats": {
        "total": 500,            // total number of comments
        "answersGiven": 241,     // total number of given answers
        "answersReceived": 123,  // total number of received answers
        "answersToSelf": 50,     // total number of comments given to themselves
        "topLevel": 104,         // total number of top-level comments
        "notPublished": 42,      // total number of unpublished comments
        "notVisible": 92,        // total number of invisible comments
        "avgLength": 301.23,     // average comment length
        "avgWords": 40.2,        // average comment word count
    },

    // Department statistics prepared for nivo (https://github.com/plouc/nivo)
    "departments": [
        {
            "dep": "Wirtschaft",  // department name
            "count": 24           // number of comments in that department
        },
        // ... all other departments
    ],

    // Weekly comment activity statistics prepared for nivo (https://github.com/plouc/nivo)
    "weekHistogram": [
        {
            "id": "mon",        // day of week abbreviation
            "count": 311        // number of comments on this day
        },
        // 6 more objects, one for each day of the week
    ],

    // Posting time heatmap data
    "timeHeatmap": [
        {
            "0": 12,  // key = hour of the day, value = number of comments
            "1": 9,
            "2": 0,
            // 22 more entries, one for each hour
        },
        // 6 more objects, one for each day of the week
    ]
}
```

### Error Response

**Code:** `400 Bad Request`

When the parameter is missing, not a number or a negative number.