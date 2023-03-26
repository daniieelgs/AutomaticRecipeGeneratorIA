
export default class Openai{

    constructor(){
        this.apiKey = 'YOUR_API_KEY';
        this.apiUrl = 'https://api.openai.com/v1/completions';
        this.apiImageUrl = 'https://api.openai.com/v1/images/generations';
    }

    async completion(prompt, model = 'text-davinci-003', maxTokens = 512, temperature = 0.7){

        try{

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    max_tokens: maxTokens,
                    temperature: temperature
                })
            });
    
            return await response.json();

        }catch(error){
            console.error(error);
            throw error;
        }

    }

    async completionImage(title, size = '1024x1024', n = 1){

        try{

            const response = await fetch(this.apiImageUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    prompt: title,
                    size: size,
                    response_format: 'url',
                })
            });

            return await response.json();

        }catch(error){
            console.error(error);
            throw error;
        }

    }

}
