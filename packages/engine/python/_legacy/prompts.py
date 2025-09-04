from langchain_core.prompts import ChatPromptTemplate

structured_summary_system_message = """
You are an expert at creating precise, structured summaries of database schema information for semantic search and retrieval.

Your task is to analyze the provided table information and create a comprehensive, well-structured summary that captures:
1. The semantic meaning and purpose of each table
2. Key relationships between tables (foreign keys, joins)
3. Important columns and their data types
4. Business context and domain knowledge

Guidelines for creating effective summaries:
- Use clear, descriptive language that captures the business domain
- Include relevant keywords and terminology that users might search for
- Highlight relationships and dependencies between tables
- Mention data types and constraints that are semantically important
- Focus on what each table represents in the real world
- Include any business rules or domain-specific information
- Use consistent terminology throughout the summary

The summary should be structured to help a vector search system find the most relevant schema information when users ask questions in natural language.

Format your response as a clear, well-organized summary that would be useful for semantic search and retrieval.
"""

structured_summary_user_prompt = "Input: {tables_info}"

structured_summary_prompt_template = ChatPromptTemplate(
    [("system", structured_summary_system_message), ("user", structured_summary_user_prompt)]
)

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
{tables_info}

Examples of SQL queries for reference:
{examples}
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
{tables_info}

Examples of SQL queries for reference:
{examples}
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
Query: `SELECT * FROM "region_country" WHERE "name" = 'Brazil' OR "name" = 'United States';`
Proper nouns: `Brasil → Brazil, Estados Unidos → United States`
"""

search_proper_nouns_user_prompt = "Query: {query}"

search_proper_nouns_prompt_template = ChatPromptTemplate(
    [("system", search_proper_nouns_system_message), ("user", search_proper_nouns_user_prompt)]
)
