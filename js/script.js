import Openai from './openai.js';

let lastInput = null;

const listInputIngredients = document.querySelector("ol.list-input-ingredients");

function updateLastInput(){

    if(lastInput) lastInput.removeEventListener('input', inputEvent);

    lastInput = document.querySelector("ol.list-input-ingredients li:last-child > input");

    lastInput.addEventListener('input', inputEvent);

    lastInput.addEventListener('blur', blurInputEvent);

}

function createnNewInputIngredient(){

    const itemList = document.createElement('LI');

    const inputIngredient = document.createElement('INPUT');
    inputIngredient.classList.add("input-ingredients");

    itemList.appendChild(inputIngredient);

    return itemList;

}

function inputEvent(e){

    const value = e.target.value

    const newInput = createnNewInputIngredient();

    listInputIngredients.appendChild(newInput);

    updateLastInput();

}

function blurInputEvent(e){

    const input = e.target;

    if(!input.value.trim() && input != lastInput) listInputIngredients.removeChild(input.parentElement);

}

updateLastInput();

const inputSuggestion = document.querySelector(".input-suggestion");

const suggerText = document.querySelector(".suggestion-text");
suggerText.addEventListener("click", e => inputSuggestion.focus());

inputSuggestion.addEventListener("focus", e => suggerText.style.display = "none");
inputSuggestion.addEventListener("blur", e => {
    if(!e.target.value.trim()) suggerText.style.display = "inline-block";
});


const recipeTitle = 'Título de la receta';
const resultRecipe = document.querySelector(".result-recipe");
const resultRecipeTitle = resultRecipe.querySelector(".result-recipe-title");
const resultRecipeImg = resultRecipe.querySelector(".result-recipe-image");
const resultRecipeImgLoader = resultRecipe.querySelector(".loader");
const resultRecipeText = resultRecipe.querySelector(".result-recipe-text");
const inputQuestion = document.querySelector(".question-recipe");
const questionLoader = document.querySelector(".question-recipe-container .loader");
const newResponseContainer = document.querySelector(".new-responses-container");

let recipe_title = "";

const toastError = document.getElementById('toastError');
let conver = [];

const downScroll = () => window.scrollTo(0,document.documentElement.scrollHeight);

function showError(errorMessage){
    toastError.querySelector(".toast-body").innerText = errorMessage;
    new bootstrap.Toast(toastError).show();
}

function get_ingredients(){

    const ingredients = [];

    document.querySelectorAll("ol.list-input-ingredients li:not(:last-child) input.input-ingredients").forEach(n => ingredients.push(n.value.toLowerCase()));

    return ingredients;
}

function create_dish_prompt(ingredients, suggestion = ''){

    const prompt = `Crea una receta detallada basada solo en los siguientes ingredientes: ${ingredients.join(', ')}.\nAdicionalmente, asigna un titulo empezando por '${recipeTitle}' a esta receta.\n${!!suggestion ? `Ten en cuenta también la siguiente sugerencia: ${suggestion}` : ''}`;

    return prompt;
}

function create_question_prompt(conversation = conver){
    return `La siguiente es una conversación con un asistente de IA. El asistente es útil, creativo, inteligente y muy amable: ${conversation.join('\n')}. Siguiendo el flujo de la conversación, hazte pasar por esta IA y devuelve solo una respuesta.`
}

async function execute_response(recipe){

    try{

        const openai = new Openai();

        const data = await openai.completion(recipe);

        return data.choices[0].text;

    } catch(error){
        showError(error.message);
    }

}

function extract_title(recipe) {
    const regex = /^.*título de la receta: .*$/gm;
    const match = recipe.toLowerCase().match(regex);
    const title = match[0].trim().split(`${recipeTitle.toLowerCase()}: `)[1];
    return title.charAt(0).toUpperCase() + title.slice(1);
}  

async function execute_image_response(recipeTitle){
    try{

        const openai = new Openai();

        const data = await openai.completionImage(recipeTitle, '512x512');

        return data.data[0].url;

    }catch(error){
        showError(error.message);
    }

}

async function loadWriteText(text, component){
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    let effect = true;

    const stopEffect = () => effect = false;

    component.addEventListener('click', stopEffect);

    const lines = text.split('\n');

    for(let line of lines){
        const letters = Array.from(line.charAt(0).toUpperCase() + line.slice(1));

        for(let letter of letters){
            component.innerHTML += letter;
            if(effect) await wait(25);
            downScroll();
        }

        component.innerHTML += '<br/>';
        downScroll();
    }

    component.removeEventListener('click', stopEffect);

}

function loadRecipe(title, recipe){
    resultRecipe.style.display = "";
    resultRecipeTitle.innerText = title;
    downScroll();
    loadWriteText(recipe.toLowerCase().split(recipeTitle.toLowerCase() + ": " + title.toLowerCase())[1].trim(), resultRecipeText);
}

async function loadImage(title = recipe_title){

    loadingOn(resultRecipeImgLoader);

    const imageURL = await execute_image_response(recipe_title);

    if(!imageURL){
        loadingOff(resultRecipeImgLoader);
        return;
    }

    console.log({imageURL});

    resultRecipeImg.src = imageURL;
    resultRecipeImg.parentElement.style.display = "";

    loadingOff(resultRecipeImgLoader);

}

function clear(){

    newResponseContainer.innerHTML = "";
    resultRecipeImg.parentElement.style.display = "none";
    resultRecipeImg.src = "";
    resultRecipe.style.display = "none";
    resultRecipeTitle.innerHTML = "";
    resultRecipeText.innerHTML = "";

}

const loadingOn = loader => loader.classList.add('loading');

const loadingOff = loader => loader.classList.remove('loading');

document.getElementById('btnGeneratorSubmit').addEventListener('click', async e => {
    loadingOn(e.target.querySelector("i.loader"));

    clear();

    const ingredients = get_ingredients();
    
    const recipe = create_dish_prompt(ingredients, document.getElementById('suggestionInput').value);

    const result_text = await execute_response(recipe);

    if(!result_text){
        loadingOff(e.target.querySelector("i.loader"));
        return;
    }

    conver.push(`Human: ${recipe}`)
    conver.push(`AI: ${result_text}`);

    console.log({result_text});

    recipe_title = extract_title(result_text);

    console.log({recipe_title});

    loadRecipe(recipe_title, result_text);

    await loadImage(recipe_title);
    downScroll();

    loadingOff(e.target.querySelector("i.loader"));
});

document.querySelector(".reload-icon").addEventListener("click", () => loadImage());

function loadQuestionResponse(question, response){

    const newResponse = document.createElement('DIV');
    newResponse.classList.add('new-response');

    const h4 = document.createElement('H4');
    h4.classList.add('new-response-title');
    h4.innerText = question;

    newResponse.appendChild(h4);

    const p = document.createElement('P');
    p.classList.add('new-response-text');

    newResponse.appendChild(p);

    newResponseContainer.appendChild(newResponse);

    response = response.replace("AI: ", '');

    loadWriteText(response.startsWith(':') ? response.replace(':', '').trim() : response.trim(), p);

}

document.querySelector(".btn-question").addEventListener('click', async () => {

    const question = inputQuestion.value;

    if(!question) return;

    loadingOn(questionLoader);

    conver.push(`Human: ${question}`);

    const prompt = create_question_prompt(conver);

    const result_question = await execute_response(prompt);

    conver.push(`AI: ${question}`);

    console.log({result_question});

    loadQuestionResponse(question, result_question);

    loadingOff(questionLoader);

    inputQuestion.value = "";
});

/*
Título de la receta: Tortilla de Patatas con Jamón y Queso

Ingredientes:
- 6 patatas
- 100 g de jamon
- 100 g de queso

Instrucciones:

1. Cortar las patatas en rodajas finas y colocarlas en un tazón.

2. Agregar el jamon y el queso al tazón, mezclando todos los ingredientes.

3. Calentar una sartén antiadherente a fuego medio alto.

4. Agregar la mezcla de patatas, jamon y queso a la sartén y cocinar durante aproximadamente 10 minutos, dando vuelta la mezcla con una espátula para que se cocine por igual.

5. Una vez que la tortilla esté lista, retirarla de la sartén y servir caliente. 

¡Listo! Ya puedes disfrutar de tu deliciosa tortilla de patatas con jamón y queso.
*/
