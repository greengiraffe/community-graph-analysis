--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2 (Ubuntu 13.2-1.pgdg18.04+1)
-- Dumped by pg_dump version 13.2

-- Started on 2021-05-15 14:19:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2985 (class 1262 OID 32769)
-- Name: zondata; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE zondata WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C.UTF-8';


ALTER DATABASE zondata OWNER TO postgres;

\connect zondata

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 32770)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 2986 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


--
-- TOC entry 221 (class 1255 OID 73752)
-- Name: post_time_heatmap(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.post_time_heatmap(u_id integer) RETURNS TABLE(hour integer, mon bigint, tue bigint, wed bigint, thu bigint, fri bigint, sat bigint, sun bigint)
    LANGUAGE plpgsql
    AS $$
begin
    return query
    select 
        date_part('hour', created)::int as hour, 
        sum((extract(dow from created) = 1)::int) as mon,
        sum((extract(dow from created) = 2)::int) as tue,
        sum((extract(dow from created) = 3)::int) as wed,
        sum((extract(dow from created) = 4)::int) as thu,
        sum((extract(dow from created) = 5)::int) as fri,
        sum((extract(dow from created) = 6)::int) as sat,
        sum((extract(dow from created) = 0)::int) as sun
    from zon_comments_cleaned
    where user_id = u_id
    group by hour
    order by hour;
end;
$$;


ALTER FUNCTION public.post_time_heatmap(u_id integer) OWNER TO postgres;

--
-- TOC entry 222 (class 1255 OID 73754)
-- Name: post_weekday_histogram(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.post_weekday_histogram(u_id integer) RETURNS TABLE(mon bigint, tue bigint, wed bigint, thu bigint, fri bigint, sat bigint, sun bigint)
    LANGUAGE plpgsql
    AS $$
begin
    return query
    select 
        count(*) filter (where extract(dow from created) = 1) as mon,
        count(*) filter (where extract(dow from created) = 2) as tue,
        count(*) filter (where extract(dow from created) = 3) as wed,
        count(*) filter (where extract(dow from created) = 4) as thu,
        count(*) filter (where extract(dow from created) = 5) as fri,
        count(*) filter (where extract(dow from created) = 6) as sat,
        count(*) filter (where extract(dow from created) = 0) as sun
    from zon_comments_cleaned
    where user_id = u_id;
end;
$$;


ALTER FUNCTION public.post_weekday_histogram(u_id integer) OWNER TO postgres;

--
-- TOC entry 209 (class 1255 OID 32780)
-- Name: sort_departments(json); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sort_departments(json) RETURNS json
    LANGUAGE sql
    AS $_$
    select json_agg(value order by (value->>'count')::numeric desc)
    from json_array_elements($1)
$_$;


ALTER FUNCTION public.sort_departments(json) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 203 (class 1259 OID 73808)
-- Name: user_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_mapping (
    user_id integer NOT NULL,
    random_name text
);


ALTER TABLE public.user_mapping OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 98422)
-- Name: zon_comments_cleaned; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zon_comments_cleaned (
    article_id text NOT NULL,
    comment_id integer NOT NULL,
    parent_id integer,
    created timestamp with time zone NOT NULL,
    raw_content text,
    published boolean NOT NULL,
    visible boolean NOT NULL,
    user_id integer NOT NULL,
    department text
);


ALTER TABLE public.zon_comments_cleaned OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 114796)
-- Name: answerer_graph; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.answerer_graph AS
 WITH user_ids AS (
         SELECT zon_comments_cleaned.user_id,
            zon_comments_cleaned.comment_id,
            zon_comments_cleaned.parent_id
           FROM public.zon_comments_cleaned
        ), user_names AS (
         SELECT user_mapping.user_id,
            user_mapping.random_name
           FROM public.user_mapping
        )
 SELECT posters.user_id AS poster,
    poster_names.random_name AS poster_name,
    answerers.user_id AS answerer,
    answerer_names.random_name AS answerer_name,
    count(answerers.user_id) AS weight
   FROM (((user_ids posters
     JOIN user_ids answerers ON ((posters.comment_id = answerers.parent_id)))
     JOIN user_names poster_names ON ((posters.user_id = poster_names.user_id)))
     JOIN user_names answerer_names ON ((answerers.user_id = answerer_names.user_id)))
  GROUP BY posters.user_id, poster_names.random_name, answerers.user_id, answerer_names.random_name
  WITH NO DATA;


ALTER TABLE public.answerer_graph OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 73788)
-- Name: department_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_mapping (
    source text NOT NULL,
    target text
);


ALTER TABLE public.department_mapping OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 114814)
-- Name: user_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.user_stats AS
 SELECT DISTINCT ON (a.user_id) a.user_id,
    user_mapping.random_name,
    min(a.created) OVER (PARTITION BY a.user_id) AS first_post_date,
    max(a.created) OVER (PARTITION BY a.user_id) AS last_post_date,
    avg(char_length(a.raw_content)) OVER (PARTITION BY a.user_id) AS avg_comment_length,
    avg(array_length(regexp_split_to_array(a.raw_content, '\s'::text), 1)) OVER (PARTITION BY a.user_id) AS avg_comment_word_count,
    count(a.comment_id) OVER (PARTITION BY a.user_id) AS count_total,
    count(a.user_id) FILTER (WHERE (a.published = false)) OVER (PARTITION BY a.user_id) AS count_not_published,
    count(a.user_id) FILTER (WHERE (a.visible = false)) OVER (PARTITION BY a.user_id) AS count_not_visible,
    count(a.user_id) FILTER (WHERE (a.parent_id IS NULL)) OVER (PARTITION BY a.user_id) AS count_top_level,
    count(a.user_id) FILTER (WHERE ((a.parent_id IS NOT NULL) AND (parent.user_id <> a.user_id))) OVER (PARTITION BY a.user_id) AS count_replies_to_others,
    b.count_replies_from_others,
    b.count_replies_from_self,
    c.departments,
    c.departments_array
   FROM ((((public.zon_comments_cleaned a
     LEFT JOIN public.user_mapping ON ((a.user_id = user_mapping.user_id)))
     LEFT JOIN public.zon_comments_cleaned parent ON ((a.parent_id = parent.comment_id)))
     JOIN ( SELECT DISTINCT t1.user_id,
            count(t2.user_id) FILTER (WHERE (t2.user_id <> t1.user_id)) OVER (PARTITION BY t1.user_id) AS count_replies_from_others,
            count(t2.user_id) FILTER (WHERE (t2.user_id = t1.user_id)) OVER (PARTITION BY t1.user_id) AS count_replies_from_self
           FROM (public.zon_comments_cleaned t1
             LEFT JOIN public.zon_comments_cleaned t2 ON ((t2.parent_id = t1.comment_id)))) b ON ((a.user_id = b.user_id)))
     LEFT JOIN ( SELECT t.user_id,
            json_agg(json_build_object('dep', t.dep, 'count', t.comment_count)) AS departments,
            array_agg(t.dep) AS departments_array
           FROM ( SELECT a_1.user_id,
                    dep_mapping.target AS dep,
                    count(dep_mapping.target) AS comment_count
                   FROM (public.zon_comments_cleaned a_1
                     JOIN public.department_mapping dep_mapping ON ((dep_mapping.source = a_1.department)))
                  GROUP BY a_1.user_id, dep_mapping.target) t
          GROUP BY t.user_id) c ON ((a.user_id = c.user_id)))
  WITH NO DATA;


ALTER TABLE public.user_stats OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 122990)
-- Name: departments_graph; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.departments_graph AS
 WITH t1 AS (
         SELECT x.user_id,
            x.dep
           FROM ( SELECT user_stats.user_id,
                    unnest(user_stats.departments_array) AS dep
                   FROM public.user_stats) x
          WHERE (x.dep <> ALL (ARRAY['Unbekannt'::text, 'Sonstige'::text]))
        ), edgelist AS (
         SELECT a.dep AS dep1,
            b.dep AS dep2,
            count(*) AS commenter_count
           FROM (t1 a
             JOIN t1 b ON ((a.user_id = b.user_id)))
          GROUP BY a.dep, b.dep
        )
 SELECT e1.dep1,
    e1.dep2,
    e1.commenter_count,
    e2.total_dep1_sum,
    ((e1.commenter_count)::double precision / (e2.total_dep1_sum)::double precision) AS weight
   FROM (edgelist e1
     JOIN ( SELECT edgelist.dep1,
            sum(edgelist.commenter_count) AS total_dep1_sum
           FROM edgelist
          GROUP BY edgelist.dep1) e2 ON ((e1.dep1 = e2.dep1)))
  ORDER BY ((e1.commenter_count)::double precision / (e2.total_dep1_sum)::double precision) DESC, e1.dep1, e1.dep2
  WITH NO DATA;


ALTER TABLE public.departments_graph OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 73755)
-- Name: test_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_comments (
    article_id text,
    comment_id integer NOT NULL,
    parent_id integer,
    created timestamp with time zone,
    raw_content text,
    published boolean,
    visible boolean,
    user_id integer,
    department text,
    keyword text
);


ALTER TABLE public.test_comments OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 73862)
-- Name: zon_comments_raw; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zon_comments_raw (
    article_id text,
    comment_id integer,
    parent_id integer,
    created timestamp with time zone,
    raw_content text,
    published boolean,
    visible boolean,
    user_id integer,
    department text
);


ALTER TABLE public.zon_comments_raw OWNER TO postgres;

--
-- TOC entry 2834 (class 2606 OID 73799)
-- Name: department_mapping department_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_mapping
    ADD CONSTRAINT department_mapping_pkey PRIMARY KEY (source);


--
-- TOC entry 2832 (class 2606 OID 73797)
-- Name: test_comments test_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_comments
    ADD CONSTRAINT test_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 2836 (class 2606 OID 114783)
-- Name: user_mapping user_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_mapping
    ADD CONSTRAINT user_mapping_pkey PRIMARY KEY (user_id);


--
-- TOC entry 2846 (class 2606 OID 114795)
-- Name: zon_comments_cleaned zon_comments_cleaned_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zon_comments_cleaned
    ADD CONSTRAINT zon_comments_cleaned_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 2837 (class 1259 OID 82014)
-- Name: idx_article_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_article_id ON public.zon_comments_raw USING btree (article_id);


--
-- TOC entry 2841 (class 1259 OID 106591)
-- Name: idx_cleaned_article_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cleaned_article_id ON public.zon_comments_cleaned USING btree (article_id);


--
-- TOC entry 2842 (class 1259 OID 106592)
-- Name: idx_cleaned_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cleaned_comment_id ON public.zon_comments_cleaned USING btree (comment_id);


--
-- TOC entry 2843 (class 1259 OID 106593)
-- Name: idx_cleaned_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cleaned_created ON public.zon_comments_cleaned USING btree (created);


--
-- TOC entry 2844 (class 1259 OID 106590)
-- Name: idx_cleaned_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cleaned_user_id ON public.zon_comments_cleaned USING btree (user_id);


--
-- TOC entry 2838 (class 1259 OID 82016)
-- Name: idx_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_id ON public.zon_comments_raw USING btree (comment_id);


--
-- TOC entry 2839 (class 1259 OID 82017)
-- Name: idx_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parent_id ON public.zon_comments_raw USING btree (parent_id);


--
-- TOC entry 2840 (class 1259 OID 82015)
-- Name: idx_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_id ON public.zon_comments_raw USING btree (user_id);


-- Completed on 2021-05-15 14:19:23

--
-- PostgreSQL database dump complete
--

