const firebase = require('firebase');
const uniqid = require('uniqid');
const bcrypt = require('bcrypt');

bcrypt.hash('admin', 10).then(console.log)

var firebaseConfig = {
  apiKey: 'AIzaSyBVXzvc5jpv4GZSW_Au0O_r_3el9FXSaiI',
  authDomain: 'ryco-base.firebaseapp.com',
  projectId: 'ryco-base',
  storageBucket: 'ryco-base.appspot.com',
  messagingSenderId: '284135401372',
  appId: '1:284135401372:web:3eb13651427058d95c4a59'
};
// Initialize Firebase
firebase.default.initializeApp(firebaseConfig);

const FireStore = firebase.default.firestore();

const LoginUserByUser = async (user, pass) => {
  let userInfo = null;
  let passHash = null;
  let userNotFound = true;
  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      if (!snapshot.docs[0]) return;
      snapshot.forEach((doc) => {
        let data = doc.data();
        passHash = data.pass;
        userInfo = {
          user: data.user,
          money: data.money,
          pontos: data.pontos,
          token: data.token
        };
      });
    });

  if (userInfo) {
    if (await bcrypt.compare(pass, passHash)) return userInfo;
    else return { message: 'Usuario e/ou senha invalida', error: true };
  } else {
    return { message: 'Usuario e/ou senha invalida', error: true };
  }
};

const LoginUserByToken = async (token) => {
  let userInfo = null;
  await FireStore.collection('users')
    .where('token', '==', token)
    .get()
    .then((snapshot) => {
      if (!snapshot.docs[0]) return;
      snapshot.forEach((doc) => {
        let data = doc.data();
        userInfo = {
          user: data.user,
          money: data.money,
          pontos: data.pontos,
          token: data.token
        };
      });
    });

  if (userInfo) {
    return userInfo;
  } else {
    return { message: 'Token invalido', error: true };
  }
};

const newUser = async ({ user, pass, firstName, lastName }) => {
  let IsUserWithThisNick = false;

  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      snapshot.forEach((i) => {
        IsUserWithThisNick = true;
      });
    });

  if (IsUserWithThisNick === true)
    return { message: 'Nome de usuario indisponivel' };

  const token = `${uniqid()}${uniqid()}${uniqid()}${uniqid()}`;
  const userInfos = {
    user,
    pass: await bcrypt.hash(pass, 10),
    firstName,
    lastName,
    token
  };

  FireStore.collection('users')
    .add({
      ...userInfos,
      cart: {
        cc: [],
        consultavel: [],
        gift: [],
        lara: [],
        login: []
      },
      infos: {
        cc: [],
        ccbonus: [],
        consultavel: [],
        gift: [],
        lara: [],
        login: []
      },
      cobs: [],
      money: 0,
      pontos: 0
    })
    .then((res) => true)
    .catch((res) => false);

  return userInfos;
};

const getGiftCard = async (gift) => {
  let array = [];
  let error = null;

  await FireStore.collection('produtos')
    .doc('gifts')
    .get()
    .then((doc) => {
      let arr = doc.data();

      if (gift === 'netflix') {
        let arrNew = arr[gift];
        for (card of arrNew) {
          if (card.keys.length > 0)
            array.push({ value: card.value, plano: card.plano, estoque: true });
          else
            array.push({
              value: card.value,
              plano: card.plano,
              estoque: false
            });
        }
      } else {
        array = arr[gift].map((c) => {
          if (c.keys.length > 0) return { value: c.value, estoque: true };
          else return { value: c.value, estoque: false };
        });
      }
    })
    .catch((err) => {
      error = err;
    });

  if (error) return error;
  return array;
};

const getLogins = async (gift) => {
  let array = [];
  let error = null;

  await FireStore.collection('produtos')
    .doc('login')
    .get()
    .then((doc) => {
      let arr = doc.data().logins;

      array = arr.map((c) => {
        // if(c.keys.length > 0) return {preco: c.preco,loja: c.loja , estoque: true }
        // else return {preco: c.preco,loja: c.loja , estoque: false }
        return { preco: c.preco, loja: c.loja, estoque: c.keys.length };
      });
    })
    .catch((err) => {
      error = err;
    });

  if (error) return error;
  return array;
};

const getCc = async (type) => {
  let array = [];

  await FireStore.collection('produtos')
    .doc('cc')
    .get()
    .then((doc) => {
      let arr = doc.data();

      array = arr[type];

      array = arr[type].map((card) => {
        return {
          band: card.band,
          bin: card.bin,
          emissor: card.emissor,
          cpf: card.cpf ? 'Sim' : 'Não',
          nome: card.nome ? 'Sim' : 'Não',
          valid: card.valid,
          value: card.value,
          tipo: card.tipo,
          nivel: card.nivel,
          vender: card.vender,
          pais: card.pais,
          limit: card.limit,
          id: card.id
        };
      });
    });

  return array;
};

const GetLara = async () => {
  let array = [];

  await FireStore.collection('produtos')
    .doc('lara')
    .get()
    .then((doc) => {
      let arr = doc.data().arr;

      array = arr.map((card) => {
        return {
          banco: card.banco,
          nivel: card.nivel,
          titular: card.titular,
          cpf: card.cpf ? 'Sim' : 'Não',
          pix: card.pix ? 'Sim' : 'Não',
          nome: card.nome ? 'Sim' : 'Não',
          vendedor: card.vendedor,
          value: card.value,
          id: card.id
        };
      });
    });

  return array;
};

const getConsul = async (loja) => {
  const res = (
    await FireStore.collection('produtos').doc('consultaveis').get()
  ).data()[loja];

  return res;
};

const creatCc = async (type, obj) => {
  await FireStore.collection('produtos')
    .doc('cc')
    .update({
      [type]: firebase.default.firestore.FieldValue.arrayUnion(obj)
    });
};

// for (let i = 0; i < 160; i++){
//     creatCc('ccfull', {value: 10, id: Math.random()+""+Math.random()+""})
// }

// for (let i = 0; i < 3; i++){
//     creatCc('cc', {
//         value: 10,
//         id: Math.random() + "" + Math.random() + ""+ Math.random() + ""+ Math.random() + ""+ Math.random() + "",
//         bin: 516292,
//         emissor: 'ITAU INIBANCO',
//         nivel: "STANDARD",
//         cvv: "726",
//         numero: "5162923312878677",
//         valid: `01/28`
//     })
// }

const AddCobranca = async (id, cob) => {
  let lastArrayCobs;

  await FireStore.collection('cobs').add({
    data: cob.calendario.criacao,
    loc: cob.loc,
    valor: cob.valor.original,
    user: id,
    txid: cob.txid
  });

  await FireStore.collection('users')
    .where('user', '==', id)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        lastArrayCobs = doc.data().cobs;

        let newCobs = [...lastArrayCobs, cob];

        await FireStore.collection('users').doc(doc.id).update({
          cobs: newCobs
        });
      });
    });
};

const GetCart = async (user) => {
  let response = {};

  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        let prods = doc.data().cart;
        let totalPreco = 0;

        prods.cc.map((i) => (totalPreco += i.value * i.quantidade));
        prods.gift.map((i) => (totalPreco += i.value * i.quantidade));
        prods.lara.map((i) => (totalPreco += i.value * i.quantidade));
        prods.login.map((i) => (totalPreco += i.value * i.quantidade));
        prods.consultavel.map((i) => (totalPreco += i.value * i.quantidade));

        response = {
          prods,
          totalPreco
        };
      });
    });

  return response;
};

const DeleteCart = async (user, item) => {
  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        let lastCart = doc.data().cart;

        if (item.prod === 'consultaveis') {
          let lastProd = doc.data().cart.consultavel;

          let arrayProds = lastProd.filter((i) => {
            let valueI = i.value === item.value;

            if (i.type === item.type) {
              return !valueI;
            } else {
              return true;
            }
          });

          let newCart = { ...lastCart, consultavel: [...arrayProds] };

          await FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        } else {
          let lastProd = doc.data().cart[item.prod];

          let arrayProds = lastProd.filter((i) => {
            let valueI = i.value === item.value;

            if (i.type === item.type) {
              return !valueI;
            } else {
              return true;
            }
          });

          let newCart = { ...lastCart, [item.prod]: [...arrayProds] };

          await FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        }
      });
    });
};

const PostCart = async (user, item) => {
  let res = {};

  if (item.prod === 'gift') {
    let test = await FireStore.collection('produtos').doc('gifts').get();
    let estoque = await test
      .data()
      [item.newProd.type].filter((c) => c.value === item.newProd.value)[0].keys
      .length;
    if (estoque < 1) return (res = { error: true, message: 'Sem Estoque' });
  }

  if (item.prod === 'login') {
    let test = await FireStore.collection('produtos').doc('login').get();
    let estoque = await test
      .data()
      .logins.filter((c) => c.loja === item.newProd.loja)[0].keys.length;
    if (estoque < 1) return (res = { error: true, message: 'Sem Estoque' });
  }

  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        let lastCart = doc.data().cart;
        let lastProd = doc.data().cart[item.prod];
        let newProd = item.newProd;

        let isCardOk;

        let newCart = { ...lastCart, [item.prod]: [...lastProd, item.newProd] };

        if (item.prod === 'gift') {
          let test = await FireStore.collection('produtos').doc('gifts').get();
          let estoque = await test
            .data()
            [newProd.type].filter((c) => c.value === newProd.value)[0].keys
            .length;

          let objNew = {
            ...newProd,
            estoque
          };

          isCardOk = lastProd.filter(
            (i) => i.type === newProd.type && i.value === newProd.value
          );

          if (isCardOk.length > 0) {
            const lastProdWithoutCard = lastProd.filter(
              (i) => i.type !== newProd.type && i.value !== newProd.value
            );

            let obj;

            if (isCardOk[0].quantidade + 1 > estoque)
              obj = {
                ...isCardOk[0],
                quantidade: estoque,
                estoque
              };
            else
              obj = {
                ...isCardOk[0],
                quantidade: isCardOk[0].quantidade + 1,
                estoque
              };

            newCart = {
              ...lastCart,
              [item.prod]: [...lastProdWithoutCard, obj]
            };
          }
          newCart = { ...lastCart, [item.prod]: [...lastProd, objNew] };

          await FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        } else if (item.prod === 'cc') {
          await FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        } else if (item.prod === 'lara') {
          await FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        } else if (item.prod === 'login') {
          let test = await FireStore.collection('produtos').doc('login').get();
          let estoque = await test
            .data()
            .logins.filter((c) => c.loja === item.newProd.loja)[0].keys.length;

          let IsItemInCard = lastCart.login.filter(
            (l) => l.loja === item.newProd.loja
          );

          let objNew = {};

          if (IsItemInCard.length === 0) {
            objNew = {
              ...newProd,
              quantidade: 1,
              estoque
            };

            await FireStore.collection('users')
              .doc(doc.id)
              .update({
                'cart.login':
                  firebase.default.firestore.FieldValue.arrayUnion(objNew)
              });
          } else {
            objNew = {
              ...IsItemInCard[0],
              quantidade: IsItemInCard[0].quantidade + 1,
              estoque
            };

            let IsWithoutItemInCard = lastCart.login.filter(
              (l) => l.loja !== item.newProd.loja
            );

            await FireStore.collection('users')
              .doc(doc.id)
              .update({
                'cart.login': [objNew, ...IsWithoutItemInCard]
              });
          }
        } else if (item.prod === 'consultavel') {
          let consul = (
            await FireStore.collection('produtos').doc('consultaveis').get()
          ).data();
          let obj = consul[item.loja].filter(
            (c) => c.id === item.newProd.id
          )[0];

          await FireStore.collection('users')
            .doc(doc.id)
            .update({
              'cart.consultavel':
                firebase.default.firestore.FieldValue.arrayUnion(newProd)
            });
        }
      });
    });

  return res;
};

const addMoreOneOnItem = async (user, item) => {
  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      snapshot.forEach(async (doc) => {
        let lastCart = doc.data().cart;
        let lastProd = doc.data().cart[item.prod];
        let prodToAdd = item.prodToAdd;

        let isCardOk;

        let newCart = {
          ...lastCart,
          [item.prod]: [...lastProd, item.prodToAdd]
        };

        if (item.prod === 'gift') {
          isCardOk = lastProd.filter(
            (i) => i.type === prodToAdd.type && i.value === prodToAdd.value
          );

          let test = await FireStore.collection('produtos').doc('gifts').get();
          let estoque = await test
            .data()
            [prodToAdd.type].filter((c) => c.value === prodToAdd.value)[0].keys
            .length;

          if (isCardOk[0].quantidade + 1 > estoque) {
            const lastProdWithoutCard = lastProd.filter(
              (i) => i.type !== prodToAdd.type && i.value !== prodToAdd.value
            );

            let obj = {
              ...isCardOk[0],
              quantidade: estoque
            };

            newCart = {
              ...lastCart,
              [item.prod]: [obj, ...lastProdWithoutCard]
            };
            res = { message: 'Sem Estoque', error: true };
          } else {
            const lastProdWithoutCard = lastProd.filter(
              (i) => i.type !== prodToAdd.type && i.value !== prodToAdd.value
            );
            let obj = {
              ...isCardOk[0],
              quantidade: isCardOk[0].quantidade + 1
            };

            newCart = {
              ...lastCart,
              [item.prod]: [...lastProdWithoutCard, obj]
            };
            res = { message: 'Com Estoque', error: false };
          }

          FireStore.collection('users').doc(doc.id).update({
            cart: newCart
          });
        } else if (item.prod === 'login') {
          let prodLogin = await FireStore.collection('produtos')
            .doc('login')
            .get();
          let estoque = prodLogin
            .data()
            .logins.filter((c) => c.loja === prodToAdd.loja)[0].keys.length;

          let loginObjs = lastCart.login.filter(
            (l) => l.loja === prodToAdd.loja
          )[0];
          let loginsWithoutObj = lastCart.login.filter(
            (l) => l.loja !== prodToAdd.loja
          );

          let obj = {};

          if (loginObjs.quantidade + 1 > estoque) {
            obj = {
              ...loginObjs,
              quantidade: estoque
            };
          } else {
            obj = {
              ...loginObjs,
              quantidade: loginObjs.quantidade + 1
            };
          }

          FireStore.collection('users')
            .doc(doc.id)
            .update({
              'cart.login': [obj, ...loginsWithoutObj]
            });
        }
      });
    });
};

const rmMoreOneOnItem = async (user, item) => {
  let res = {};

  await FireStore.collection('users')
    .where('user', '==', user)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        let lastCart = doc.data().cart;
        let lastProd = doc.data().cart[item.prod];
        let prodToAdd = item.prodToAdd;

        let isCardOk;

        let newCart;

        if (item.prod === 'gift') {
          isCardOk = lastProd.filter((i) => i.loja === prodToAdd.loja);

          if (isCardOk[0].quantidade === 1)
            DeleteCart(user, {
              type: prodToAdd.type,
              prod: 'login',
              value: prodToAdd.value
            });

          const lastProdWithoutCard = lastProd.filter(
            (i) => i.type !== prodToAdd.type && i.value !== prodToAdd.value
          );

          let obj = {
            ...isCardOk[0],
            quantidade: isCardOk[0].quantidade - 1
          };

          newCart = { ...lastCart, [item.prod]: [...lastProdWithoutCard, obj] };
        }
        if (item.prod === 'login') {
          isCardOk = lastProd.filter(
            (i) => i.type === prodToAdd.type && i.value === prodToAdd.value
          );

          if (isCardOk[0].quantidade === 1)
            DeleteCart(user, {
              type: prodToAdd.type,
              prod: 'gift',
              value: prodToAdd.value
            });

          const lastProdWithoutCard = lastProd.filter(
            (i) => i.type !== prodToAdd.type && i.value !== prodToAdd.value
          );

          let obj = {
            ...isCardOk[0],
            quantidade: isCardOk[0].quantidade - 1
          };

          newCart = { ...lastCart, [item.prod]: [...lastProdWithoutCard, obj] };
        }

        await FireStore.collection('users').doc(doc.id).update({
          cart: newCart
        });
      });
    });
};

const BuyItensCard = async (token, checkCcs) => {
  let response = { ccLive: 0, ccDied: 0 };

  let user = (
    await FireStore.collection('users').where('token', '==', token).get()
  ).docs[0];

  let data = user.data();
  let cart = await GetCart(data.user);
  let idUser = user.id;

  buy().then((e) => {
    console.log('=========================');
    console.log(e);
    console.log('=========================');
  });

  return 'ok';
};

const GetInfos = async (token, type) => {
  let array = [];

  await FireStore.collection('users')
    .where('token', '==', token)
    .get()
    .then((snapshot) => {
      lastArryUser = snapshot.forEach(async (doc) => {
        let arr = await doc.data().infos[type];

        array = arr;
      });
    });

  return array;
};

const ChangePassword = async (oldPass, newPass, token) => {
  let res = { error: false };

  let DataUser = await (
    await FireStore.collection('users').where('token', '==', token).get()
  ).docs[0];
  if (!DataUser) return (res = { error: true, message: 'Erro inesperado :(' });
  let oldPassCorrect = DataUser.data().pass;
  let docId = DataUser.id;

  console.log(oldPass);
  console.log(await bcrypt.compare(oldPass, oldPassCorrect));

  if (
    !(await bcrypt.compare(
      oldPass,
      oldPassCorrect
    )) /*oldPassCorrect !== oldPass*/
  ) {
    res = { error: true, message: 'Senha Incorreta' };
  } else if (newPass.length < 6) {
    res = { error: true, message: 'Senha muito curta' };
  } else {
    await FireStore.collection('users')
      .doc(docId)
      .update({
        pass: await bcrypt.hash(newPass, 10)
      });

    res = { error: false, message: 'Senha alterada com Sucesso!' };
  }

  return res;
};

const AddLogin = async (loja, preco) => {
  await FireStore.collection('produtos')
    .doc('login')
    .update({
      logins: firebase.default.firestore.FieldValue.arrayUnion({
        loja: loja,
        preco: preco
      })
    });
};

const getCcBonusUser = async (user) => {
  let data = await (
    await FireStore.collection('users').where('user', '==', user).get()
  ).docs[0].data().pontos;

  return { value: data };
};

const buyCcBonus = async (token, idCc) => {
  let res = {};

  const user = (
    await FireStore.collection('users').where('token', '==', token).get()
  ).docs[0];
  const pts = user.data().pontos;
  const cc = (await FireStore.collection('produtos').doc('cc').get())
    .data()
    .bonus.filter(({ id }) => id === idCc)[0];
  const ccListWithoutCc = (
    await FireStore.collection('produtos').doc('cc').get()
  )
    .data()
    .bonus.filter(({ id }) => id !== idCc);

  if (pts < cc.value) return { error: true, message: 'Pontos Insuficientes' };
  else {
    await FireStore.collection('users')
      .doc(user.id)
      .update({
        'infos.ccbonus': firebase.default.firestore.FieldValue.arrayUnion(cc),
        pontos: pts - cc.value
      })
      .catch((err) => (res = { error: true, message: err }));

    await FireStore.collection('produtos').doc('cc').update({
      bonus: ccListWithoutCc
    });
  }

  return res;
};

async function GetCobs(token) {
  let res = await (
    await FireStore.collection('users').where('token', '==', token).get()
  ).docs[0].data().cobs;

  return res;
}

const PixPayment = async (pix) => {
  let pixInfos = await (
    await FireStore.collection('cobs').where('txid', '==', pix.txid).get()
  ).docs[0];
  await FireStore.collection('cobs').doc(pixInfos.id).update({
    paga: true
  });
  await FireStore.collection('users')
    .where('user', '==', pixInfos.data().user)
    .get()
    .then((snap) => {
      snap.forEach(async (doc) => {
        let money = doc.data().money;
        await FireStore.collection('users')
          .doc(doc.id)
          .update({
            money: money + Number(pix.valor)
          });
      });
    });
};

const RemoveInfo = async (token, type, id) => {
  const docUser = (
    await FireStore.collection('users').where('token', '==', token).get()
  ).docs[0];
  const data = docUser.data();

  if (type === 'cc') {
    const infosWithout = data.infos.cc.filter((c) => id !== c.id);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.cc': infosWithout
    });
  }

  if (type === 'ccbonus') {
    const infosWithout = data.infos.ccbonus.filter((c) => id !== c.id);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.ccbonus': infosWithout
    });
  }

  if (type === 'consultavel') {
    const infosWithout = data.infos.consultavel.filter((c) => id !== c.id);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.consultavel': infosWithout
    });
  }

  if (type === 'lara') {
    const infosWithout = data.infos.lara.filter((c) => id !== c.id);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.lara': infosWithout
    });
  }

  if (type === 'login') {
    const infosWithout = data.infos.login.filter((c) => id !== c.id);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.login': infosWithout
    });
  }

  if (type === 'gift') {
    const infosWithout = data.infos.gift.filter((c) => id !== c.key);

    await FireStore.collection('users').doc(docUser.id).update({
      'infos.gift': infosWithout
    });
  }
};

module.exports = {
  LoginUserByUser,
  newUser,
  getGiftCard,
  getCc,
  creatCc,
  AddCobranca,
  GetCart,
  PostCart,
  DeleteCart,
  addMoreOneOnItem,
  rmMoreOneOnItem,
  GetInfos,
  BuyItensCard,
  LoginUserByToken,
  GetLara,
  getLogins,
  getConsul,
  ChangePassword,
  getCcBonusUser,
  buyCcBonus,
  GetCobs,
  PixPayment,
  RemoveInfo,
  FireStore,
  firebase
};
