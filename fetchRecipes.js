const fetch = require("node-fetch");
const fs = require('fs');
const path = require('path');
const rimraf = require("rimraf");
require('dotenv').config();

async function fetchRecipes(offset, limit, clearFolder) {

    const token = process.env.BEARER;
    const folderPath = 'src/recipes';

    if ( clearFolder == true) {
        console.log('ℹ️  clear the folder first')
        rimraf.sync(folderPath)
    }

    try {
        if(!fs.existsSync(folderPath)) {
            console.log('ℹ️  the folder for the recipes is missing so lets create one ')
            fs.mkdirSync(folderPath);
            console.log('ℹ️  create the recipes.json')

            const recipesJsonData = `{
    "tags": "recipes",
    "layout": "post"
}`
            fs.writeFile(`${folderPath}/recipes.json`, recipesJsonData, (err) => {
                if (err) {
                    throw err
                }
                console.log("recipes.json created");
            })

        }
    } catch (err) {
        console.error(err)
    }

    if ( limit != null ) {
        var limit = limit;
        console.log(limit)
    } else {
        var limit = 250;
    }

    const response = await fetch(`https://gw.hellofresh.com/api/recipes/search?offset=${offset}&limit=${limit}&locale=de-DE&country=de`, {headers: {
        'Authorization': `Bearer ${token}`
    }});

    // const data = await response.json()

    const data = await response.json()
    const items = data.items;
    const total = data.total;
    
    if ( offset >= total) {
        return false
    }

    // var offset = offset + 250;

    items.forEach ((item, index) => {

        var slug = item.slug;

        if (slug.includes("thermomix")) {
            return false;
        }

        // create an empty array for the steps of the recipe
        var steps = new Array();
        
        // create an empty array for the tags
        var tags = new Array();
        
        // create an empty array for the titles of the tags
        var tagTitles = new Array();

        // push the steps into the empty array

        // var stepsImages = new Array();

        // var stepsInstructions = new Array();

        for (i = 0; i < item.steps.length; i++) {
            steps.push(`<img src='https://res.cloudinary.com/hellofresh/image/upload/f_auto,fl_lossy,h_436,q_auto/v1/hellofresh_s3${item.steps[i].images[0].path}'/>`);
            steps.push(item.steps[i].instructionsHTML);
        }

        // const stepsArray = [...stepsImages, ...stepsInstructions];

        // console.log(stepsImages, stepsInstructions);
        // return false;

        // item.steps.forEach ((step, index) => {
        //     [
        //         steps.push(`<img src='https://res.cloudinary.com/hellofresh/image/upload/f_auto,fl_lossy,h_436,q_auto/v1/hellofresh_s3${step.images[0].path}'/>`),
        //         steps.push(step.instructionsHTML)
        //     ]
        // })


        // pust thte tags into the empty tags array
        item.tags.forEach (( tag ) => {
            tags.push(tag.slug)
        })

        // push the titles of the tags into the empty tagsTitle array
        item.tags.forEach (( tag ) => {
            tagTitles.push(tag.name)
        })

        // return false;


        const jsonData = `---
name: "${item.name}"
headline: "${item.headline}"
imagePath: ${item.imagePath}
description: "${item.seoDescription}"
permalink: /recipes/${item.slug}.html
recipeTags: ['${tags.join("', '")}']
recipeTagTitles: ['${tagTitles.join("', '")}']
---
${item.descriptionHTML}
${steps.join("\n")}
`

        fs.writeFile(`src/recipes/${item.slug}.md`, jsonData, (err) => {
            if (err) {
                throw err
            }

            console.log(item.slug +  " created");
        })
    });
}

fetchRecipes(200, 25, false);