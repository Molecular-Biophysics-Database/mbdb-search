from src.luqul_convertor import construct_luqum_tree
from luqum.tree import Word, SearchField, Range, Phrase, OrOperation, AndOperation
import json
import pytest


class TestSingleFields:
    def test_string_value(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": "bar"
            }
        ]
        """
        expected_output = SearchField("foo", Word("bar"))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_fulltext_value(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": "bar baz"
            }
        ]
        """
        expected_output = SearchField("foo", Phrase('"bar baz"'))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_unicode_value(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": "bař"
            }
        ]
        """
        expected_output = SearchField("foo", Word("bař"))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_number_value(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": "1"
            }
        ]
        """
        expected_output = SearchField("foo", Word("1"))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_negative_number_value(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": "-1"
            }
        ]
        """
        expected_output = SearchField("foo", Word("-1"))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_unicode_field(self):
        json_input = """
        [
            {
                "field": "bař",
                "value": "foo"
            }
        ]
        """
        expected_output = SearchField("bař", Word("foo"))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_date_range(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": {
                  "from": "2024-03-01",
                  "to": "2024-04-30"
                }
            }
        ]
        """
        expected_output = SearchField("foo", Range(Word("2024-03-01"), Word("2024-04-30")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_negative_values_range(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": {
                  "from": "-20",
                  "to": "40"
                }
            }
        ]
        """

        expected_output = SearchField("foo", Range(Word("-20"), Word("40")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_wildcard_range(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": {
                  "from": "*",
                  "to": "40"
                }
            }
        ]
        """

        expected_output = SearchField("foo", Range(Word("*"), Word("40")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_open_lower_range(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": {
                  "to": "40"
                }
            }
        ]
        """

        expected_output = SearchField("foo", Range(Word("*"), Word("40")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_open_upper_range(self):
        json_input = """
        [
            {
                "field": "foo",
                "value": {
                  "from": "-20"
                }
            }
        ]
        """

        expected_output = SearchField("foo", Range(Word("-20"), Word("*")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_raise_on_missing_field(self):
        json_input = """
        [
            {
                "value": "foo"
            }
        ]
        """
        with pytest.raises(ValueError):
            construct_luqum_tree(json.loads(json_input))

    def test_raise_on_missing_value(self):
        json_input = """
        [
            {
                "field": "foo"
            }
        ]
        """
        with pytest.raises(ValueError):
            construct_luqum_tree(json.loads(json_input))


class TestOperators:
    json_input_template = """
        [
            {
                "field": "foo",
                "value": "bar"
            },
            {
                "operator": "%"
            },
            {
                "field": "bas",
                "value": "qux"
            }
        ]
    """

    def test_or(self):
        json_input = self.json_input_template.replace("%", "or")
        expected_output = OrOperation(SearchField("foo", Word("bar")), SearchField("bas", Word("qux")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_and(self):
        json_input = self.json_input_template.replace("%", "and")
        expected_output = AndOperation(SearchField("foo", Word("bar")), SearchField("bas", Word("qux")))
        assert construct_luqum_tree(json.loads(json_input)) == expected_output

    def test_not(self):
        pass


class TestBrackets:
    def test_and(self):
        pass

    def test_or(self):
        pass

    def test_not(self):
        pass
