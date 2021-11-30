// 須代入自己的網址路徑
const api_URL = "https://livejs-api.hexschool.io/api/livejs/v1";
const api_path = "11111111111";
const token = "phRImiBZsIYgr8P9RjV9rjgr3ws2";

// DOM
const productSelect = document.querySelector(".js-productSelect");  //選擇產品類別
const productList = document.querySelector(".js-productList");  //產品列表
const cartList = document.querySelector(".js-cartList");  //購物車列表
const orderInfo = document.querySelectorAll('.js-orderInfo-input');  //訂單資料
const sendOrder = document.querySelector('.js-orderInfo-btn');  //送出訂單(按鈕)
const form = document.querySelector(".js-orderInfo-form");  //表單

// 存放產品和購物車內容
let productData = [];
let cartData = [];
let cartInfo = [];

// 初始化
function init() {
  getProductList();
  getCartList();
}
init();

// 取得產品列表
function getProductList() {
  axios.get(`${api_URL}/customer/${api_path}/products`)
    .then(function (response) {
      productData = response.data.products;
      renderProductList();
    })
    .catch(function (error) {
      console.log("取得產品列表 失敗");
    })
}

// 渲染產品列表(全部)
function renderProductList() {
  let str = "";
  productData.forEach(function (item) {
    str += `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}" alt="">
        <a href="#shoppingCart" class="addCardBtn"
        data-addbtn="add" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${item.origin_price}</del>
        <p class="nowPrice">NT$${item.price}</p></li>`;
  })
  productList.innerHTML = str;
}

// 篩選產品(依種類)
productSelect.addEventListener("change", function (e) {
  e.preventDefault();
  let category = e.target.value;
  if (e.target.value == "全部") {
    renderProductList();
    return;
  }
  let str = "";
  productData.forEach(function (item) {
    if (item.category == category) {
      str += `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}" alt="">
        <a href="#shoppingCart" class="addCardBtn"  data-addbtn="add" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${item.origin_price}</del>
        <p class="nowPrice">NT$${item.price}</p></li>`;
    }
  })
  productList.innerHTML = str;
})

// 將產品加入購物車
productList.addEventListener("click", function (e) {
  e.preventDefault();
  if (e.target.dataset.addbtn !== "add") {
    return;
  }

  let num = 1; //預設產品的數量為1
  // 假如產品已在購物車中，將產品數量+1
  cartData.forEach(function (item) {
    if (e.target.dataset.id == item.product.id) {
      num = item.quantity + 1;
    }
  })

  axios.post(`${api_URL}/customer/${api_path}/carts`, {
    data: {
      "productId": e.target.dataset.id,
      "quantity": num,
    }
  })
    .then(function (response) {
      getCartList();
    })
    .catch(function (error) {
      console.log("將產品加入購物車 失敗");
    })
})

// 取得購物車列表
function getCartList() {
  axios.get(`${api_URL}/customer/${api_path}/carts`)
    .then(function (response) {
      cartData = response.data.carts;
      cartInfo = response.data;
      let strTitle = ""; //暫存表頭的innerHTML
      let strContnet = ""; //暫存內容的innerHTML
      let strTotal = ""; //暫存結算的innerHTML
      strTitle = `<tr>
                      <th width="40%">品項</th>
                      <th width="15%">單價</th>
                      <th width="15%">數量</th>
                      <th width="15%">金額</th>
                      <th width="15%"></th>
                  </tr>`;
      // 放多個cartData
      cartData.forEach(function (item) {
        strContnet += `<tr>
                  <td>
                      <div class="cardItem-title">
                          <img src="${item.product.images}" alt="">
                          <p>${item.product.title}</p>
                      </div>
                  </td>
                  <td>NT$${item.product.price}</td>
                  <td class="cardItem-quantity">
                    <a href="#" class="material-icons" data-quantity="remove" data-id="${item.id}"> remove_circle_outline</a>
                    <span>${item.quantity}</span>
                    <a href="#" class="material-icons" data-quantity="add" data-id="${item.id}"> add_circle_outline</a>
                  </td>
                  <td>NT$${item.quantity * item.product.price}</td>
                  <td class="discardBtn">
                      <a href="#shoppingCart" class="material-icons"
                       data-dltone="delete" data-id="${item.id}">
                          clear
                      </a>
                  </td>
              </tr>`;
      })
      strTotal = `<tr>
                      <td>
                          <a href="#shoppingCart" class="discardAllBtn"
                           data-dltall="delete">刪除所有品項</a>
                      </td>
                      <td></td>
                      <td></td>
                      <td>
                          <p>總金額</p>
                      </td>
                      <td>NT$${cartInfo.finalTotal}</td>
                  </tr>`;
      cartList.innerHTML = strTitle + strContnet + strTotal;
    })
    .catch(function (error) {
      console.log("取得購物車列表 失敗");
    })
}

// 監聽購物車列表
cartList.addEventListener('click', function (e) {
  e.preventDefault();
  if (e.target.dataset.dltone == "delete") {
    //刪除特定產品(利用訂單ID)
    deleteCartItem(e.target.dataset.id);
    return;

  } else if (e.target.dataset.dltall == "delete") {
    //刪除全部產品
    deleteAllCartItem();
    return;

  } else if (e.target.dataset.quantity == "remove") {
    //編輯購物車數量(remove)
    updateCartNum('remove',e);
    return;

  } else if (e.target.dataset.quantity == "add") {
    //編輯購物車數量(add))
    updateCartNum('add',e);
    return;

  } else {
    return;
  }
})

// 編輯購物車數量
function updateCartNum(status,e) {
  let id = e.target.dataset.id;  //購物車內產品ID
  let num;  //購物車內產品數量

  /*找出購物車內產品數量*/
  cartData.forEach((item) => {
    if(item.id == id){
      num = item.quantity;
    }
  });

  if(status == "add"){
    num+=1;
  }else{
    if(num>0){
      num-=1;
    }
  }

  const data={
    data: {
      id,
      quantity: num,
    }
  }

  // 如果數量變成0就將此商品刪除
  if(num==0){
    deleteCartItem(id);
  }else{
    axios.patch(`${api_URL}/customer/${api_path}/carts`,data)
    .then(function(response){
      console.log(response);
      getCartList();
    })
    .catch(function(error){
      console.log("編輯購物車數量 失敗");
    })
  }
}

// 刪除購物車內特定(ID)產品
function deleteCartItem(cartId) {
  axios.delete(`${api_URL}/customer/${api_path}/carts/${cartId}`)
    .then(function (response) {
      getCartList();
    })
    .catch(function (error) {
      console.log("刪除購物車內特定產品 失敗");
    })
}

// 刪除購物車內全部產品
function deleteAllCartItem() {
  axios.delete(`${api_URL}/customer/${api_path}/carts`)
    .then(function (response) {
      getCartList();
    })
    .catch(function (error) {
      console.log("刪除購物車內全部產品 失敗");
    })
}

// 表單的限制
const constraints = {
  "姓名": {
    presence: {
      message: "必填欄位"
    }
  },
  "電話": {
    presence: {
      message: "必填欄位"
    },
    length: {
      minimum: 8,
      message: "需超過 8 碼"
    }
  },
  "Email": {
    presence: {
      message: "必填欄位"
    },
    email: {
      message: "格式錯誤"
    }
  },
  "寄送地址": {
    presence: {
      message: "必填欄位"
    }
  },
  "交易方式": {
    presence: {
      message: "必填欄位"
    }
  },
};

// 判斷是否有表格未填
orderInfo.forEach((item) => {
  item.addEventListener("change", function () {
    item.nextElementSibling.textContent = ''; //假如表格有填寫，將提醒字"必填"清空
    let errors = validate(form, constraints) || ""; //如果沒有錯誤就回傳空值
    // 利用keys把錯誤訊息印出來 
    if (errors) {
      Object.keys(errors).forEach(function (keys) {
        document.querySelector(`[data-message="${keys}"]`).textContent = errors[keys];
      })
    }
  });
});

// 送出購買訂單(按鈕)
sendOrder.addEventListener('click', function (e) {
  e.preventDefault();

  //存放(判斷是否有表格未填)結果
  let errors = validate(form, constraints) || "";
  //判斷是否有表格未填
  if (errors) {
    alert('訂單資料有錯誤！');
    return;
  }

  //判斷購物車是否是空的
  if (cartData.length == '') {
    alert('請加入至少一個購物車品項！');
    return;
  }

  let data = {
    "user": {
      "name": orderInfo[0].value,
      "tel": orderInfo[1].value,
      "email": orderInfo[2].value,
      "address": orderInfo[3].value,
      "payment": orderInfo[4].value
    }
  }
  //將訂單資料傳至(新增購物清單)function
  createOrder(data);
})

// 對後台新增一個購買清單
function createOrder(data) {
  axios.post(`${api_URL}/customer/${api_path}/orders`, { data })
    .then(function (response) {
      alert("訂單已成功送出");
      // 將表格初始化
      orderInfo.forEach(function (item, index) {
        if (item.getAttribute('name') !== "交易方式") {
          item.value = "";
          item.nextElementSibling.textContent = "必填";
        } else {
          item.value = "ATM";
        }
      })
      getCartList();
    })
    .catch(function (error) {
      console.log("對後台新增一個購買清單 失敗");
    })
}