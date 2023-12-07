await axios({
    method: "POST",
    url: `${baseUrl}oauth/token`,
    headers: {
        Authorization: `Basic ${credentials}`,
        "content-type": "application/json"
    },
    httpsAgent: agent,
    data: {
        grant_type: 'client_credentials'
    }
}).then(res => {
    let token = res.data.access_token

    axios({
        method: "POST",
        url: `${baseUrl}v2/cob`,
        headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json"
        },
        httpsAgent: agent,
        data: {
            "calendario": {
              "expiracao": 3600
            },
            "valor": {
              "original": "100.00"
            },
            "chave": "f9ee99a8-a18e-4afc-bb1d-2d4f21e09311",
            "solicitacaoPagador": "Informe o número ou identificador do pedido."
          }
    }).then(async(res) => {
        // console.log(res);
        infos = res
    })
})