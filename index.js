const compressor = require('node-minify');
const sass = require('node-sass');
const fs = require('fs');
const path = require('path');

// DEPENDENCY: NODE V10.10.0

const watchDirectory = process.argv[2];

// from https://stackoverflow.com/a/40896897
function flatten(lists) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath)
    .map(file => path.join(srcpath, file))
    .filter(path => fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath) {
  return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

const init = (directory) => {
  try {
    fs.watch(directory, (eventType, fileName) => {
      const splittedName = fileName.split('.');
      // return already minified file
      if (splittedName.some(each => each === 'min')) return;
      const extension = splittedName.pop();
      const minFileName = `${splittedName.join('.')}.min`;
      let compressorName;
      
      switch (extension) {
        case 'scss':
          // do compile to css
          sass.render({
            file: `${directory}/${fileName}`
          }, (err, result) => {
            if (err) {
              console.log('Oops, you could not compile scss!');
              return;
            }
            fs.writeFile(`${directory}/${minFileName}.css`, result.css, (err) => {
              if (err) {
                console.log('Oops, you could not write file.');
                return;
              }
            });
          });
          return;
        case 'html':
          compressorName = 'html-minifier';
          break;
        case 'css':
          compressorName = 'clean-css';
          break;
        case 'js':
          compressorName = 'babel-minify';
          break;
        default:
          compressorName = 'gcc';
      }

      const promise = compressor.minify({
        compressor: compressorName,
        input: `${directory}/${fileName}`,
        output: `${directory}/${minFileName}.${extension}`,
      });
    
      promise.then((min) => {
        fs.writeFile(`${directory}/${minFileName}.${extension}`, min, (err) => {
          if (err) {
            console.log('Oops, you could not write file with node-minify.');
            return;
          }
        });
      });
    })
  } catch(e) {
  }
}

getDirectoriesRecursive(watchDirectory).forEach(dir => init(dir));
