from sanic import Sanic
from sanic.response import json
from sanic.log import logger
from sanic.exceptions import InvalidUsage
from sanic_cors import CORS
from aiocache import cached, Cache, SimpleMemoryCache
from aiocache.serializers import PickleSerializer
import db

app = Sanic(name="community_graph_server")
cors = CORS(app)
cache = Cache(SimpleMemoryCache, serializer=PickleSerializer())

# Note: caching and CORS don't work well together when
# the caching decoraters are added after an @app.route(). A workaround is
# therefor used: an intermediate method inside the request
# handlers is decorated with @cached and returns the data to be cached


@app.after_server_start
async def connect_db(app, loop):
    try:
        logger.info("Connecting to DB")
        await db.connect(loop)
        logger.info("DB connected!")
    except ConnectionRefusedError:
        logger.error("DB connnection refused. Is the DB running?")
        # app.register_listener(app.stop(), 'after_server_start')
        app.stop()


@app.after_server_stop
async def disconnect_db(app, loop):
    try:
        logger.info("Closing DB connection")
        await db.disconnect()
        logger.info("DB connection closed!")
    finally:
        return


def keybuilder(function, request):
    """Creates a caching key from the request URL"""
    return request.url


@app.route("/answerer-graph", methods=["GET", "OPTIONS"])
async def answerer_graph(request):
    try:
        answer_threshold = int(request.args.get("answerThreshold"))
        selfloops = bool(int(request.args.get("selfloops")))
        largest_subgraph_only = bool(int(request.args.get("largestSubgraphOnly")))
    except TypeError:
        logger.warning("TypeError for /answerer-graph", exc_info=1)
        raise InvalidUsage("Invalid parameters (TypeError)", status_code=400)
    except ValueError:
        logger.warning("ValueError for /answerer-graph", exc_info=1)
        raise InvalidUsage("Invalid parameters (ValueError)", status_code=400)

    if answer_threshold <= 0:
        logger.warning("answerThreshold <= 0 for /answerer-graph")
        raise InvalidUsage("answerThreshold must be > 0", status_code=400)

    @cached(ttl=900, key_builder=keybuilder)  # cache result for 15 minutes
    async def data(request):
        return await db.answerer_graph(
            answer_threshold=answer_threshold,
            selfloops=selfloops,
            largest_subgraph_only=largest_subgraph_only,
        )

    return json(await data(request))


@app.route("/departments-graph", methods=["GET", "OPTIONS"])
async def deps_graph(request):
    @cached(ttl=900, key_builder=keybuilder)  # cache result for 15 minutes
    async def data(request):
        return await db.departments_graph()

    return json(await data(request))


@app.route("/user", methods=["GET", "OPTIONS"])
async def user_data(request):
    try:
        user_id = int(request.args.get("userId"))
    except Exception:
        raise InvalidUsage("userId must be a number", status_code=400)

    @cached(ttl=120, key_builder=keybuilder)  # cache result for 2 minutes
    async def data(request):
        return await db.user_data(user_id)

    return json(await data(request))


# Run using `python server.py` or `pipenv run server.py`
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, auto_reload=True, access_log=False, debug=False)
