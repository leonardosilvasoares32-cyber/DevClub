/* Strings
    sao textos que podem conter letras, numeros, simbolos e espacos. Eles sao definidos entre aspas simples (' '), aspas duplas (" ") ou 
    crase (` `) usando a crase, podemos pudar linhas. A craze tambem e chamada de template literals ou template strings.

*/
let saudacao = "Olá, Mundo!";
console.log(saudacao);

let mensagem = "Olá, Mundo!";
console.log(mensagem);

// aqui usamos crase para criar uma string que abrange várias linhas
let multilineString = `Esta é uma string
que abrange várias
linhas.`;
console.log(multilineString);

/*
    Agora vaos algumas formas de ustilizar o template strings com crase:

*/
// EXEMPLO 1 - Interpolação de variáveis
let nome = "Maria";
let idade = 30;
let apresentacao = `Meu nome é ${nome} 
                    e
                    eu tenho ${idade} anos.`;
console.log(apresentacao);


// EXEMPLO 2 - Podemos realizar operações dentro das expressões
let a = 5;
let b = 10;
let soma = `A soma de ${a} e ${b} é ${a + b}.`;
console.log(soma);


// EXEMPLO 3 - Chamando métodos de string dentro das expressões
let frase = "javascript é incrível";
let fraseMaiuscula = `Frase em maiúsculas: ${frase.toUpperCase()}`; // chama o método toUpperCase() para converter a frase em maiúsculas
console.log(fraseMaiuscula);


// EXEMPLO 4 - Usando expressões condicionais       
let hora = 14;
let saudacaoHora = `Boa ${hora < 12 ? "manhã" : hora < 18 ? "tarde" : /*hora > 18 ?*/ "noite"}!`; 
console.log(saudacaoHora);


// EXEMPLO 5 - Podemos chamar funções dentro das expressões
function saudacaoFunc(nome) { // função que retorna uma saudação personalizada
    return `Olá, ${nome}!`; // retorna a saudação com o nome fornecido
}
let mensagemSaudacao = `${saudacaoFunc("Carlos")}`; // chama a função saudacaoFunc dentro do template string
console.log(mensagemSaudacao);

/* Números
    em JavaScript, os números são representados por um único tipo de dado chamado "number". Eles podem ser inteiros (sem casas decimais) ou de ponto flutuante 
    (com casas decimais). JavaScript também suporta operações matemáticas básicas, como adição, subtração, multiplicação e divisão.
*/