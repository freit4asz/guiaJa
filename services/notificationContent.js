function guideApplication({nome, email, curriculo}) {
  return {
    subject: 'Nova candidatura de guia - GuiaJa',
    text: [
      'Uma nova pessoa se candidatou para ser guia no GuiaJa.',
      '',
      `Nome: ${nome}`,
      `E-mail: ${email}`,
      '',
      'Currículo:',
      curriculo
    ].join('\n')
  };
}

function guideMessage({senderName, senderEmail, guideName, content}) {
  return {
    subject: `Nova mensagem para ${guideName} - GuiaJa`,
    text: [
      `Olá, ${guideName}.`,
      '',
      `Você recebeu uma mensagem de ${senderName} (${senderEmail}):`,
      '',
      content,
      '',
      'Acesse o GuiaJa para combinar os detalhes da viagem.'
    ].join('\n')
  };
}

function purchase({
  user,
  codigo,
  dataIda,
  packageName,
  destination,
  guideName,
  hotelName,
  total,
  packageOriginal,
  discount,
  flightRoute
}) {
  return {
    subject: `Nova compra ${codigo} - GuiaJa`,
    text: [
      'Uma nova compra foi registrada no GuiaJa.',
      '',
      `Cliente: ${user.nome}`,
      `E-mail do cliente: ${user.email}`,
      `Voucher: ${codigo}`,
      `Data da viagem/check-in: ${dataIda}`,
      `Pacote/serviço: ${packageName}`,
      ...(flightRoute ? [`Voo: ${flightRoute}`] : []),
      `Destino: ${destination || 'Não informado'}`,
      `Guia: ${guideName || 'Sem guia'}`,
      `Hospedagem: ${hotelName || 'Não incluída'}`,
      ...(discount ? [
        `Valor original do pacote: R$ ${Number(packageOriginal).toFixed(2)}`,
        `Desconto do pacote: R$ ${Number(discount).toFixed(2)}`
      ] : []),
      `Valor: R$ ${Number(total).toFixed(2)}`,
      '',
      'Consulte a lista completa de compras e o ranking de pacotes no painel administrativo do GuiaJa.'
    ].join('\n')
  };
}

module.exports = {guideApplication, guideMessage, purchase};
