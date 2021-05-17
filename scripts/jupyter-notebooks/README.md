# Community Graph Analysis: Jupyter Notebooks

This directory contains several Jupyter Notebooks used for data analysis.

### Requirements

- Python 3.9
- pipenv
- PostgreSQL database up & running

### Installation & Running

First create a `.env` file in the same folder. Add a `DB_URL` entry to that file as shown below. Replace the placeholders `<USER>`, `<PASSWORD>` etc. with your DB credentials and the URL and port on which Postgres is listening, also specify the name of the database: 
    
```sh
DB_URI='postgresql://<USER>:<PASSWORD>@<URL>:<PORT>/<DB_NAME>'
```
for example:
```sh
DB_URI='postgresql://vvg:somepass@127.0.0.1:5432/mydata'
```

Now you can run:

- `pipenv install` to install all requirements including Jupyter and Jupyter Lab
- `pipenv run jupyter lab` to run the Jupyter Lab and view the notebooks in your browser