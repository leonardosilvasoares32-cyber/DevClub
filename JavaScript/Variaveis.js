console.log("Hello, World!");

/*
    -let: Declara uma variável de escopo de bloco, que pode ser alterada a qualquer momento.
    -const: Declara uma variável de escopo de bloco, que não pode ser reatribuída, nao pode ser alterada depois de declarada.
    -var: Declara uma variável de escopo global ou de função, que pode ser reatribuída. (Evitar o uso de var em código moderno, pois a variavel foi descontinuada em 
    favor do let e const)
    
*/
let idade = 25;
const nome = "João";
var cidade = "São Paulo";
console.log("Idade:", idade);
console.log("Nome:", nome);
console.log("Cidade:", cidade);
// Reatribuindo a variável 'idade' declarada com let
idade = 26;
console.log("Idade atualizada:", idade);
// Tentando reatribuir a variável 'nome' declarada com const (isso causará um erro)
//nome = "Maria"; // Descomente esta linha para ver o erro
// Reatribuindo a variável 'cidade' declarada com var
cidade = "Rio de Janeiro";
console.log("Cidade atualizada:", cidade);
