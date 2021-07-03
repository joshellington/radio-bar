const randomProperty = (obj) => {
  var keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
}

const stringToHTML = (str) => {
	var parser = new DOMParser();
	var doc = parser.parseFromString(str, 'text/html');
	return doc;
};

module.exports = {
  randomProperty: randomProperty,
  stringToHTML: stringToHTML,
}