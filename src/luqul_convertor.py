from luqum.pretty import prettify
from luqum.tree import SearchField, Word, Phrase, Range, AndOperation, OrOperation, Group, Not
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
parsed_json = json.loads(json_input)
luqum_tree = construct_luqum_tree(parsed_json)
print(repr(luqum_tree))
