

document.getElementById('salvar').onclick = function adicionarLinha() {
  // 1. Obtenha os dados que o utilizador digitou (neste exemplo, vamos usar valores fixos)
  
  const name = document.querySelector( 'input[name="produto"]').value;
  const quantidade = document.querySelector( 'input[name="quantidade"]').value;
  const valor = document.querySelector( 'input[name="valor"]').value;
  const total = document.querySelector( 'input[name="total"]').value;
  
 /* const dado2 = "Quantidade";
  const dado3 = "Preco unitário";
  const dado4 = "total"; */


  // 2. Selecione o corpo da tabela
  const tbody = document.querySelector("#tabeladeVendas tbody");

  // 3. Crie uma nova linha (<tr>)
  const novaLinha = document.createElement("tr");

  // 4. Crie as células de dados (<td>) e adicione o conteúdo
  const celula1 = document.createElement("td");
  celula1.textContent = name; // Adiciona o primeiro dado
  novaLinha.appendChild(celula1); // Adiciona a célula à linha

  const celula2 = document.createElement("td");
  celula2.textContent = quantidade; // Adiciona o segundo dado
  novaLinha.appendChild(celula2); // Adiciona a célula à linha

  const celula3 = document.createElement("td");
  celula3.textContent = valor; // Adiciona o segundo dado
  novaLinha.appendChild(celula3); // Adiciona a célula à linha

  const celula4 = document.createElement("td");
  celula4.textContent = total; // Adiciona o segundo dado
  novaLinha.appendChild(celula4); // Adiciona a célula à linha

  // 5. Adicione a nova linha completa ao corpo da tabela
  tbody.appendChild(novaLinha);
}