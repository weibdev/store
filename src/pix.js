const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { log } = require('console');

const baseUrl = 'https://api-pix.gerencianet.com.br/';

const client = {
  id: 'Client_Id_e6e693da37b6480d5086687a38dbfd495bc6e35b', //Client_Id_e6e693da37b6480d5086687a38dbfd495bc6e35b
  secret: 'Client_Secret_3d848c65c9bbcc2e23188f37bc24d48a43a26da3'
};


const credentials = Buffer.from(`${client.id}:${client.secret}`).toString(
  'base64'
);

const getHistory = async (token) => {
  const { FireStore } = require('./db');

  let res = [];
  let cobs = [];
  // let cobs = await (await FireStore.collection('users').where('token', "==", token).get()).docs[0].data().cobs;
};

async function PegarCob(txid) {
  const tokenRes = await axios({
    method: 'POST',
    url: `${baseUrl}oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'content-type': 'application/json'
    },
    httpsAgent: agent,
    data: {
      grant_type: 'client_credentials'
    }
  });
  const token = await tokenRes.data.access_token;

  const cobRes = await axios({
    method: 'GET',
    url: `${baseUrl}v2/cob/${txid}`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    httpsAgent: agent
  });

  const cob = await cobRes;

  return cob.data;
}

async function CobrarPix(valor) {
  let infos;

  const tokenRes = await axios({
    method: 'POST',
    url: `${baseUrl}oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'content-type': 'application/json'
    },
    httpsAgent: agent,
    data: {
      grant_type: 'client_credentials'
    }
  });
  const token = await tokenRes.data.access_token;
  console.log(token);


  const cobRes = await axios({
    method: 'POST',
    url: `${baseUrl}v2/cob`,
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    httpsAgent: agent,
    data: {
      calendario: {
        expiracao: 3600
      },
      valor: {
        original: valor.toFixed(2).toString()
      },
      chave: '840fbbec-abcf-4c32-8ba5-3c7d9dde2699',
      solicitacaoPagador: 'Informe o número ou identificador do pedido.'
    }
  });

  const cob = await cobRes;
  console.log(cob);

  // const qrcodeRes = await axios({
  //   method: 'GET',
  //   url: `${baseUrl}v2/loc/${cob.data.loc.id}/qrcode`,
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //     'content-type': 'application/json'
  //   },
  //   httpsAgent: agent
  // });

  // const qrcode = await qrcodeRes;

  // const res = {
  //   toUser: {
  //     qrcode: qrcode.data.imagemQrcode,
  //     valor: cob.data.valor,
  //     copiaCola: qrcode.data.qrcode,
  //     txid: cob.data.txid
  //   },
  //   cob
  // };
  
  // // return res;
}


module.exports = {
  CobrarPix,
  getHistory,
  PegarCob
};
