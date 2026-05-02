import { GraphQLScalarType, Kind, type ValueNode } from "graphql";

function parseJsonLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return ast.values.map((value) => parseJsonLiteral(value));
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)]),
      );
    default:
      return null;
  }
}

/** JSON scalar used by the standalone GraphQL backend for document content. */
export const jsonScalar: GraphQLScalarType = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value.",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast): unknown {
    return parseJsonLiteral(ast);
  },
});
