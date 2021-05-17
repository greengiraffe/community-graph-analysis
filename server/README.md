# Community Graph Analysis: Back End

The back end is based on a [Sanic](https://sanicframework.org/en/) server, [asyncpg](https://github.com/MagicStack/asyncpg) as the database driver, and [NetworkX](https://networkx.org/) for graph computations.

## Prerequisits

- Python 3.8 or higher
- [pipenv](https://pipenv.pypa.io/en/latest/)
- PostgreSQL (the server will fail to run if no DB connection is possible)

## Installation

1. Inside the server root folder run:

    ```sh
    pipenv install
    ```

2. Create a `.env` file in the same folder. Add a `DB_URL` entry to that file as shown below. Replace the placeholders `<USER>`, `<PASSWORD>` etc. with your DB credentials and the URL and port on which Postgres is listening, also specify the name of the database: 
    
    ```sh
    DB_URI='postgresql://<USER>:<PASSWORD>@<URL>:<PORT>/<DB_NAME>'
    ```
    for example:
    ```sh
    DB_URI='postgresql://vvg:somepass@127.0.0.1:5432/mydata'
    ```

## Running the Server

Note: the server requires a running PostgreSQL database. In Ubuntu it can usually be started using `sudo service postgresql start`.

To run the development server on `localhost:5000`:

```
pipenv run python server.py
```

or activating the environment first:

```sh
pipenv shell     # activate the virtual environment
python server.py # then start the server
```

You can stop the server process using `CTRL+C` (potentially twice).

### Server Settings

Per default the server listens on `localhost:5000`, has hot-reloading enabled and very permissive CORS settings, **thus it is not production ready**. The server settings can be changed at the bottom of the `server.py` file. The documentation for the server can be found at https://sanicframework.org/en/guide/deployment/running.html.

This is what the default development server config at the bottom of `server.py` looks like:

```py
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, auto_reload=True, access_log=True)
```

## API Documentation

See `API_DOCS.md`