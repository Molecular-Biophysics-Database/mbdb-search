import luqum
from luqum.tree import SearchField, Word, Phrase, Range, AndOperation, OrOperation, Group, Not
from luqum.parser import parser
from luqum.pretty import prettify
from luqum.elasticsearch import ElasticsearchQueryBuilder, SchemaAnalyzer
import json


def construct_luqum_tree(json_criteria):
    base = None
    stack = []
    current_op = None
    pending_not = False  # Flag to indicate the next field should be negated

    for item in json_criteria:
        if "field" in item:
            # Construct the basic search field
            field_value = item["value"]
            if isinstance(field_value, dict):
                # Range value
                field_obj = SearchField(item["field"],
                                        Range(Word(field_value.get("from", '*')), Word(field_value.get("to", '*'))))
            elif isinstance(field_value, str) and ' ' in field_value:
                # Phrase value
                field_obj = SearchField(item["field"], Phrase(f'"{field_value}"'))
            else:
                # Word value
                field_obj = SearchField(item["field"], Word(str(field_value)))

            if pending_not:
                # Wrap the field with a Not operation
                field_obj = Not(field_obj)
                pending_not = False  # Reset the flag

            if current_op:
                # Apply the current operation with the previous operation/base
                new_base = current_op(base, field_obj) if base else field_obj
                # Reset base to new operation
                base = new_base
                current_op = None
            else:
                base = field_obj if base is None else AndOperation(base, field_obj)

        elif "operator" in item:
            # Set the current operation based on the operator
            operator = item["operator"].lower()
            if operator == "and":
                current_op = AndOperation
            elif operator == "or":
                current_op = OrOperation
            elif operator == "not":
                # Set the flag to negate the next field
                pending_not = True

        elif "bracket" in item:
            # Handle bracket operations
            if item["bracket"] == "start":
                # If we encounter a start bracket, push the current base onto the stack
                stack.append((current_op, base))
                base = None
                current_op = None
            elif item["bracket"] == "end":
                # Once we hit an end bracket, we know that base contains the grouped operation
                # Pop the last operation from the stack and apply the current base to it
                op, last_base = stack.pop()
                grouped = Group(base)
                base = op(last_base, grouped) if last_base else grouped

    return base


# Example:
json_input = '''
[
  {
    "bracket": "start"
  },
  {
    "field": "metadata.general_parameters.depositors.depositor.given_name",
    "value": "Karel"
  },
  {
    "operator": "and"
  },
  {
    "field": "metadata.general_parameters.depositors.depositor.given_name",
    "value": "Pepa"
  },
  {
    "bracket": "end"
  },
  {
    "operator": "or"
  },
  {
    "bracket": "start"
  },
  {
    "field": "metadata.general_parameters.depositors.principal_contact.given_name",
    "value": "Tonda"
  },
  {
    "operator": "and"
  },
  {
    "field": "metadata.general_parameters.depositors.principal_contact.given_name",
    "value": "Mikulas"
  },
  {
    "operator": "not"
  },
  {
    "field": "metadata.general_parameters.depositors.principal_contact.family_name",
    "value": "Marek"
  },
  {
    "bracket": "end"
  },
  {
    "operator": "or"
  },
  {
    "bracket": "start"
  },
  {
    "field": "metadata.general_parameters.record_information.title",
    "value": "Mama"
  },
  {
    "operator": "and"
  },
  {
    "field": "metadata.general_parameters.record_information.deposition_date",
    "value": {
      "from": "2024-03-01",
      "to": "2024-04-30"
    }
  },
  {
    "operator": "and"
  },
  {
    "field": "metadata.general_parameters.latitude",
    "value": {
      "from": "-20",
      "to": "40"
    }
  },
  {
    "bracket": "end"
  }
]
'''

json_input2 = '''[
  {
    "field": "metadata.general_parameters.record_information.deposition_date",
    "value": "2024-03-22"
  },
  {
    "operator": "or"
  },
  {
    "field": "metadata.general_parameters.depositors.depositor.given_name",
    "value": "Karel"
  },
  {
    "operator": "or"
  },
  {
    "bracket": "start"
  },
  {
    "field": "metadata.general_parameters.latitude",
    "value": "20"
  },
  {
    "operator": "and"
  },
  {
    "field": "metadata.general_parameters.longitude",
    "value": "30"
  },
  {
    "bracket": "end"
  }
]'''
parsed_json = json.loads(json_input)
luqum_tree = construct_luqum_tree(parsed_json)
print(repr(luqum_tree))

# Load your schema
with open('mst-1.0.0.json', 'r') as file:
    mst_schema = json.load(file)

# Folowing steps form https://luqum.readthedocs.io/en/latest/quick_start.html

# Analyze the schema
schema_analyzer = SchemaAnalyzer(mst_schema)

# Create an Elasticsearch query builder with the analyzed schema options
es_builder = ElasticsearchQueryBuilder(**schema_analyzer.query_builder_options())

# Convert the Luqum tree to a Lucene query string
lucene_query = prettify(luqum_tree)
# print(lucene_query)
# print(str(luqum_tree))

# Manually adjust the lucene_query string to ensure proper spacing
lucene_query = lucene_query.replace('TO', ' TO ')
lucene_query = lucene_query.replace('NOT', 'NOT ')

print("After editing luc")
print(lucene_query)

# Now attempt parsing the adjusted query string
try:
    parsed_tree = parser.parse(lucene_query)
    # Proceed with the rest of your logic here
except luqum.exceptions.ParseSyntaxError as e:
    print("Error parsing the Lucene query string:", e)

# Parse the query string into a Luqum tree
# parsed_tree = parser.parse(lucene_query)

# Convert the Luqum tree to an Elasticsearch (OpenSearch) query
es_query = es_builder(parsed_tree)

# The es_query is now a dictionary that represents your query in a format compatible with OpenSearch
print(json.dumps(es_query, indent=2))

# It works, but for some reason it doesn't work with Range values
