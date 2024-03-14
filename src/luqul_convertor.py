from luqum.tree import SearchField, Word, Phrase, Range, AndOperation, OrOperation, Group
import json


def construct_luqum_tree(json_criteria):
    base = None
    stack = []
    current_op = None

    for item in json_criteria:
        if "field" in item:
            # Construct the basic search field
            field_value = item["value"]
            if isinstance(field_value, dict):
                # Range value
                field_obj = SearchField(item["field"],
                                        Range(Word(field_value.get("from", '')), Word(field_value.get("to", ''))))
            elif isinstance(field_value, str) and ' ' in field_value:
                # Phrase value
                field_obj = SearchField(item["field"], Phrase(f'"{field_value}"'))
            else:
                # Word value
                field_obj = SearchField(item["field"], Word(str(field_value)))

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
            # There is no direct NOT operation in luqum, NOT is typically applied to a field,
            # which in my JSON structure  can be done by setting "value": "NOT <value>"

        elif "bracket" in item:
            # Handle bracket operations
            if item["bracket"] == "start":
                # If we encounter a start bracket, push the current base onto the stack
                stack.append(base)
                base = None
            elif item["bracket"] == "end":
                # Once we hit an end bracket, we know that base contains the grouped operation
                # Pop the last operation from the stack and apply the current base to it
                if stack:
                    group_base = stack.pop()
                    grouped = Group(base)
                    if group_base is not None:
                        base = current_op(group_base, grouped) if current_op else grouped
                    else:
                        base = grouped
                current_op = None

    return base


# Example:
json_input = '''
[
  {
    "bracket": "start"
  },
  {
    "field": "title",
    "value": "other stuff"
  },
  {
    "operator": "and"
  },
  {
    "field": "body",
    "value": "quick fox"
  },
  {
    "bracket": "end"
  },
  {
    "operator": "or"
  },
  {
    "field": "title",
    "value": "fox"
  }
]
'''
parsed_json = json.loads(json_input)
luqum_tree = construct_luqum_tree(parsed_json)
print(repr(luqum_tree))
