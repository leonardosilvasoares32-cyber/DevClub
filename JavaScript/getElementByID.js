/*
para acessar o arquivo html pelo javascript, usamos o document
...document - representa o arquivo html

para pegar elementos do html, usamos os métodos do document

...getElementById - para pegar um elemento pelo id
    ...exemplo: document.getElementById("input1")

...getElementByClassName - para pegar um elemento pela class - tras todos os elementos com a mesma class
    ...exemplo: document.getElementByClassName("input1")

...getElementByTagName - para pegar um elemento pela tag - tras todos os elementos com a mesma tag
    ...exemplo: document.getElementByTagName("input")

...getElementsByName - para pegar um elemento pelo atributo name - tras todos os elementos com o mesmo name
    ...exemplo: document.getElementsByName("input1")

...querySelector - para pegar um elemento usando seletores css - tras um elemento, o PRIMEIRO QUE ENCONTRAR
    ...exemplo: document.querySelector("#input1") //pega pelo id
    ...exemplo: document.querySelector(".input1") //pega pela class
    ...exemplo: document.querySelector("input") //pega pela tag

...querySelectorAll - para pegar todos os elementos que correspondem ao seletor css - TRAS TODOS OS ELEMENTOS QUE ENCONTRAR
    ...exemplo: document.querySelectorAll("#input1") //pega pelo id
    ...exemplo: document.querySelectorAll(".input1") //pega todos os elementos com a class input1



*/
/*ABAICO TEMOS ALGUNS EXEMPLOS DE COMO USAR O getElementById*/

/* VOU PEGAR O ELEMENTO PELO ID E ARMAZELA-LO DENTRO DE UMA VARIAVEL E MOSTAR NA TELA*/
let input = document.getElementById("input1")
console.log(input)


/* VOU PEGAR O ELEMENTO PELO ID E ALTERAR O VALOR DELE */
let input2 = document.getElementById("input1")
input2.value = "Novo valor do input"
console.log(input2)


/* VOU PEGAR O ELEMENTO PELO ID E ALTERAR O ESTILO DELE */
let input3 = document.getElementById("input1")
input3.style.backgroundColor = "yellow"
input3.style.color = "red"
console.log(input3)


/* VOU PEGAR O ELEMENTO PELO ID E ADICIONAR UMA CLASSE DE CSS */
let input4 = document.getElementById("input1")
input4.classList.add("minha-classe")
console.log(input4)

/* VOU PEGAR O ELEMENTO PELO ID E REMOVER UMA CLASSE DE CSS */
let input5 = document.getElementById("input1")
input5.classList.remove("minha-classe")
console.log(input5)
