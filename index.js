function babelPluginUniversalCssProp({ types: t }) {
  const cloneNode = t.cloneNode || t.cloneDeep
  const modifyClassName = makeModifyClassName(t)

  return {
    name: 'babel-plugin-universal-css-prop',
    visitor: {
      Program: {
        enter(path, state) {
          if (!state.opts.packageName) {
            throw path.buildCodeFrameError(
              'babel-plugin-universal-css-prop - missing required option `packageName`'
            )
          }
          state.cssPropIdentifier = path.scope.generateUidIdentifier('cssProp')
        },
        exit(path, state) {
          if (state.hasCssProp) {
            const importDeclaration = t.importDeclaration(
              [
                state.opts.importName
                  ? t.importSpecifier(
                      state.cssPropIdentifier,
                      t.identifier(state.opts.importName)
                    )
                  : t.importDefaultSpecifier(state.cssPropIdentifier)
              ],
              t.stringLiteral(state.opts.packageName)
            )

            path.node.body.unshift(importDeclaration)
          }
        }
      },
      JSXAttribute(path, state) {
        if (path.node.name.name !== 'css') {
          return
        }

        const value = path.get('value')
        if (!value.isJSXExpressionContainer()) {
          return
        }

        const expression = value.get('expression')

        modifyClassName(
          path.parentPath,
          t.callExpression(cloneNode(state.cssPropIdentifier), [
            cloneNode(expression.node)
          ])
        )
        path.remove()

        state.hasCssProp = true
      }
    }
  }
}

// Rewrite className to add a cssProp CallExpression
// or adds className if it is not present.
function makeModifyClassName(t) {
  const concat = (a, b) => t.binaryExpression('+', a, b)
  const and = (a, b) => t.logicalExpression('&&', a, b)
  const or = (a, b) => t.logicalExpression('||', a, b)

  const joinSpreads = spreads => spreads.reduce((acc, curr) => or(acc, curr))

  return (path, cssPropCallExpression) => {
    const cssPropCallExpressionWithSpace = concat(
      cssPropCallExpression,
      t.stringLiteral(' ')
    )
    const attributes = path.get('attributes')
    const spreads = []
    let className = null
    // Find className and collect spreads
    for (let i = attributes.length - 1, attr; (attr = attributes[i]); i--) {
      const node = attr.node
      if (t.isJSXSpreadAttribute(attr)) {
        const name = node.argument.name
        const attrNameDotClassName = t.memberExpression(
          t.isMemberExpression(node.argument)
            ? node.argument
            : t.identifier(name),
          t.identifier('className')
        )

        spreads.push(
          // `${name}.className != null && ${name}.className`
          and(
            t.binaryExpression('!=', attrNameDotClassName, t.nullLiteral()),
            attrNameDotClassName
          )
        )
        continue
      }
      if (t.isJSXAttribute(attr) && node.name.name === 'className') {
        className = attributes[i]
        // found className break the loop
        break
      }
    }

    if (className) {
      let newClassName = className.node.value.expression || className.node.value
      newClassName =
        t.isStringLiteral(newClassName) || t.isTemplateLiteral(newClassName)
          ? newClassName
          : or(newClassName, t.stringLiteral(''))
      className.remove()

      className = t.jSXExpressionContainer(
        spreads.length === 0
          ? concat(cssPropCallExpressionWithSpace, newClassName)
          : concat(
              cssPropCallExpressionWithSpace,
              or(joinSpreads(spreads), newClassName)
            )
      )
    } else {
      className = t.jSXExpressionContainer(
        spreads.length === 0
          ? cssPropCallExpression
          : concat(
              cssPropCallExpressionWithSpace,
              or(joinSpreads(spreads), t.stringLiteral(''))
            )
      )
    }

    path.node.attributes.push(
      t.jSXAttribute(t.jSXIdentifier('className'), className)
    )
  }
}

exports = module.exports = babelPluginUniversalCssProp
exports.default = babelPluginUniversalCssProp
Object.defineProperty(exports, '__esModule', {
  value: true
})
