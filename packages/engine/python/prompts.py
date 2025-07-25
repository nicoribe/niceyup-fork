from langchain_core.prompts import ChatPromptTemplate

relevant_tables_system_message = """
You are an assistant that helps identify which tables in a database schema are relevant to a given user question.

Given a database schema and a natural language question, return a list of **only the relevant table names** that contain useful information to answer the question.

Rules:
- Only use table names from the provided schema.
- Do not make up table names.
- If a relevant table has a foreign key (FK) reference to another table, **also include that related table**, since it's likely part of the query join.
- Focus on semantic relevance: include only the tables that would logically contribute to building a correct SQL query.
- If the question can be answered using a single table, still check for any FKs that might be needed.

Schema:
{table_info}
"""

relevant_tables_user_prompt = "Question: {input}"

relevant_tables_prompt_template = ChatPromptTemplate(
    [("system", relevant_tables_system_message), ("user", relevant_tables_user_prompt)]
)

write_query_system_message = """
Given an input question, create a syntactically correct {dialect} query to
run to help find the answer. Unless the user specifies in his question a
specific number of examples they wish to obtain, always limit your query to
at most {top_k} results. You can order the results by a relevant column to
return the most interesting examples in the database.

Never query for all the columns from a specific table, only ask for a the
few relevant columns given the question.

Pay attention to use only the column names that you can see in the schema
description. Be careful to not query for columns that do not exist. Also,
pay attention to which column is in which table.

Only use the following tables:
{table_info}
"""

write_query_user_prompt = "Question: {input}"

write_query_prompt_template = ChatPromptTemplate(
    [("system", write_query_system_message), ("user", write_query_user_prompt)]
)

search_proper_nouns_system_message = """
You are an assistant that helps to find the proper nouns in a query.

1. Extract all literal string values from the query (values between single quotes, e.g., 'Brazil').
2. For each unique literal string value, call the function `search_proper_nouns(table_name, column_name, search)` to validate or correct the value.
   - Do this only for string literals, not table names or column names.
   - Skip repeated values; validate each unique string only once.
3. Replace the original literal string in the query with the result returned by `search_proper_nouns`.

Return "proper_nouns" with the proper nouns replaced. Example:
Query: `SELECT * FROM "region_country" WHERE "name" = 'Brazil' OR "name" = 'United States'`
Proper nouns: `Brasil → Brazil, Estados Unidos → United States`
"""

search_proper_nouns_user_prompt = "Query: {query}"

search_proper_nouns_prompt_template = ChatPromptTemplate(
    [("system", search_proper_nouns_system_message), ("user", search_proper_nouns_user_prompt)]
)
