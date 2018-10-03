module.exports = {
	root: true,
	extends: ['eslint:recommended'],
	// plugins: ['react'],
	// parser: 'babel-eslint',
	env: { browser: true, es6: true },
	parserOptions: {
		ecmaVersion: 8,
		impliedStrict: true,
	},
	globals: {
		imports: true,
	},
	rules: {
		'no-console': 'off',
		'react/prop-types': 'off',
	},
};
