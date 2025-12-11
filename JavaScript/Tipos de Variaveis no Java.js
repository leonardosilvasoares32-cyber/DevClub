

//comando para rodar javascript no terminal é: crtl + alt + n

// Tipos de Variáveis no JavaScript

// Variável do tipo string
let nome = "João";
console.log("Nome:", nome);
console.log("'João' é uma:", typeof nome);

// Variável do tipo number
let idade = 25;
console.log("Idade:", idade);
console.log("'idade' é uma :", typeof idade);

// Variável do tipo boolean ( verdadeiro ou falso / sim ou não )
let isEstudante = true;
console.log("Você é um estudante?", isEstudante);
console.log(" 'isEstudante' é uma variavel:", typeof isEstudante);

// Variável do tipo object ( é uma variavel que pode conter múltiplos valores )
let nomes = ["Ana", "Bruno", "Carlos"];
console.log("Nomes:", nomes);
console.log("'nomes' é uma variavel:", typeof nomes, "contendo varios nomes dentro de uma array (array é uma variavel com varios valores como se fosse uma lista)");


let pessoa = {
    nome: "Maria",
    idade: 30,
    endereco: {
       rua: "Rua das Flores, 123",
       cidade: "São Paulo",
       estado: "SP",
       telefone: " (11) 98765-4321"
    }
    };
console.log("Pessoa:", pessoa);
console.log("'pessoa' é uma variavel:", typeof pessoa);
console.log("Agora vou mostrar somente uma propriedade como exemplo, dentro do endereco, a propriedade 'Telefone':", pessoa.endereco.telefone);


// Variável do tipo undefined e Null
// a diferenca de undefined e null é:
// undefined é quando a variavel nao foi encontrada (uma cagada as veses no codigo), 
// null é quando a variavel foi definida mas nao tem valor nenhum atribuido a ela ou quando voce realmente quer dizer que ela nao tem valor nenhum.
let endereco;
let cidade = null;
console.log("Endereço:", endereco);
console.log("'endereco' é uma:", typeof endereco);
console.log("Cidade esta vazia prositalmente:", cidade);
console.log("'cidade' é uma :", typeof cidade);

// variavel do tipo array ( ja mostrado um pouco acima no object, mas aqui um exemplo mais claro )
let frutas = ["maçã", "banana", "laranja"];
console.log("Frutas:", frutas);
console.log("'frutas' é uma variavel:", typeof frutas, "que é uma array (uma lista) de frutas");

// outro exemplo de arrray trocando o tipo de dado
frutas[1] = 42; // agora o segundo item da array é um numero
console.log("Frutas (após alteração):", frutas);
console.log("Agora o segundo item da array é um número:", frutas[1], "e o tipo de dado é:", typeof frutas[1]);

//agora um array com objects dentro
let carros = [
    { marca: "Ford", modelo: "Fiesta", ano: 2018 },
    { marca: "Chevrolet", modelo: "Onix", ano: 2020 },
    { marca: "Volkswagen", modelo: "Gol", ano: 2019 }
];
console.log("Carros:", carros);
console.log("'carros' é uma variavel:", typeof carros, "que é uma array de objetos (cada objeto representa um carro com suas propriedades)");
console.log("Exemplo de acesso a uma propriedade do primeiro carro na array 'carros':", carros[0].marca);
console.log("Tipo de dado de 'idade':", typeof idade);

// variavel do tipo if & else (estrutura condicional)
let horadormir = 10;
if (horadormir >= 10) {
    console.log("Está na hora de dormir!!!!");
} else {
    console.log("Ainda não é hora de dormir.");
}

//variavel do tipo function (função), funcao é um trecho de codigo que é executado quando chamado
function saudacao(nome) {
    return "Olá, " + nome + "!";
}
console.log(saudacao("João")); // Chama a função e imprime a saudação
console.log("'saudacao' é uma variavel:", typeof saudacao, "que é uma função (function)");
