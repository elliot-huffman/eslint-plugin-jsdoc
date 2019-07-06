import _ from 'lodash';
import iterateJsdoc from '../iterateJsdoc';

export default iterateJsdoc(({
  sourceCode,
  jsdoc,
  report,
  utils,
  context,
  jsdocNode
}) => {
  if (!jsdoc.tags) {
    return;
  }
  const {definedTags = []} = context.options[0] || {};

  let definedPreferredTags = [];
  const preferredTags = _.get(context, 'settings.jsdoc.tagNamePreference');
  if (preferredTags) {
    // Replace `_.values` with `Object.values` when we may start requiring Node 7+
    definedPreferredTags = _.values(preferredTags).map((preferredTag) => {
      if (typeof preferredTag === 'string') {
        // May become an empty string but will be filtered out below
        return preferredTag;
      }
      if (!preferredTag) {
        return undefined;
      }
      if (typeof preferredTag !== 'object') {
        report(
          'Invalid `settings.jsdoc.tagNamePreference`. Values must be falsy, a string, or an object.'
        );
      }

      return preferredTag.replacement;
    }).filter((preferredType) => {
      return preferredType;
    });
  }

  jsdoc.tags.forEach((jsdocTag) => {
    const tagName = jsdocTag.tag;
    if (utils.isValidTag(tagName, [...definedTags, ...definedPreferredTags])) {
      let preferredTagName = utils.getPreferredTagName(
        tagName,
        true,
        `Blacklisted tag found (\`@${tagName}\`)`
      );
      let message = `Invalid JSDoc tag (preference). Replace "${tagName}" JSDoc tag with "${preferredTagName}".`;
      if (!preferredTagName) {
        return;
      }
      if (preferredTagName && typeof preferredTagName === 'object') {
        ({message, replacement: preferredTagName} = preferredTagName);
      }

      if (preferredTagName !== tagName) {
        report(message, (fixer) => {
          const replacement = sourceCode.getText(jsdocNode).replace(`@${tagName}`, `@${preferredTagName}`);

          return fixer.replaceText(jsdocNode, replacement);
        }, jsdocTag);
      }
    } else {
      report(`Invalid JSDoc tag name "${tagName}".`, null, jsdocTag);
    }
  });
}, {
  iterateAllJsdocs: true,
  meta: {
    fixable: 'code',
    schema: [
      {
        additionalProperties: false,
        properties: {
          definedTags: {
            items: {
              type: 'string'
            },
            type: 'array'
          }
        },
        type: 'object'
      }
    ],
    type: 'suggestion'
  }
});
