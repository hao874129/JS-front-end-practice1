// 須代入自己的網址路徑
const api_URL = "https://livejs-api.hexschool.io/api/livejs/v1";
const api_path = "11111111111";
const token = "phRImiBZsIYgr8P9RjV9rjgr3ws2";

// DOM
const orderTable = document.querySelector('.js-orderPage-table');
const discardAllBtn = document.querySelector('.discardAllBtn');

// 存放訂單內容
let orderData = [];

// 初始化
function init() {
    getOrderList();
}
init();

// 時間戳轉換為日期
const timeStampTransfer = (timeStamp) => {
    let date = new Date(timeStamp * 1000);
    let year = date.getFullYear();
    let month = date.getMonth() + 1; //因getMonth()只會return當時月號"0~11"
    let day = date.getDate();
    return `${year}/${month}/${day}`;
}

// 取得訂單列表
function getOrderList() {
    axios.get(`${api_URL}/admin/${api_path}/orders`,
        {
            headers: {
                "Authorization": token
            }
        })
        .then(function (response) {
            orderData = response.data.orders;
            renderOrderList();
            renderC3();
        })
        .catch(function (error) {
            console.log("取得訂單列表 失敗");
        })
}

// 渲染訂單列表
function renderOrderList() {
    let strHead = ""; //暫存列表的表頭
    strHead = `<thead>
                    <tr>
                        <th>訂單編號</th>
                        <th>聯絡人</th>
                        <th>聯絡地址</th>
                        <th>電子郵件</th>
                        <th>訂單品項</th>
                        <th>訂單日期</th>
                        <th>訂單狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>`;
    //  載入列表內容
    let strContent = ""; //暫存列表的內容
    orderData.forEach(function (item) {
        // 組訂單品項字串
        let strProducts = "";
        item.products.forEach(function (products) {
            strProducts += `<p>${products.title} x ${products.quantity}</p>`;
        })
        // 判斷訂單狀態
        let orderStatus = "";
        orderStatus = (item.paid == false) ? "未處理" : "已處理";
        // 組購物車列表
        strContent += `<tr>
                        <td>${item.id}</td>
                        <td>
                            <p>${item.user.name}</p>
                            <p>${item.user.tel}</p>
                        </td>
                        <td>${item.user.address}</td>
                        <td>${item.user.email}</td>
                        <td>
                            ${strProducts}
                        </td>
                        <td>${timeStampTransfer(item.createdAt)}</td>
                        <td class="orderStatus">
                            <a class="js-orderStatus" data-id="${item.id}" data-status="${item.paid}" href="#">${orderStatus}</a>
                        </td>
                        <td>
                            <input type="button" class="delSingleOrder-Btn js-deleteItem" data-id="${item.id}" value="刪除">
                        </td>
                    </tr>`;
    })
    orderTable.innerHTML = strHead + strContent;
}

function renderC3(){
    // 物件資料蒐集
    let total={}; //用來放 "品項" 與 "品項的總營收"
    orderData.forEach(function (orderItem) {
        orderItem.products.forEach(function(productItem){
            if(total[productItem.title]==undefined){
                total[productItem.title]=productItem.price*productItem.quantity;
            }else{
                total[productItem.title]+=productItem.price*productItem.quantity;
                // 將單個"品項"價錢加總後，放到"total.品項"裡
            }
        })
    })
    // 做出資料關聯
    let titleAry = Object.keys(total); //放全部品項的"品名"

    // 透過 total + titleAry 組出 C3 格式
    let productAry = []; //放全部品項的 "品名" 與 "營收"
    titleAry.forEach(function(title){
        let ary = [];
        ary.push(title);
        ary.push(total[title]);
        productAry.push(ary);
    })

    // 製作C3: columns
    let newAry = arrangeAry(productAry); //用來放 "營收前三&其他" 的 "品項" 與 "品項總營收"
    // 製作C3: colors
    newColors = {};  //用來放C3圓餅圖的顏色
    newColors[`${newAry[0][0]}`] = "#DACBFF";
    newColors[`${newAry[1][0]}`] = "#9D7FEA";
    newColors[`${newAry[2][0]}`] = "#5434A7";
    newColors[`${newAry[3][0]}`] = "#301E5F";

    // C3.js
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newAry,
            colors: newColors,
        },
    });
}

// 對陣列做排列，排出營收 "前三" 與 "其他"
function arrangeAry(ary){
    let newAry = new Array(); //排列後陣列
    let temp=[]; //暫存資料

    // 將傳進來的參數ary做營收排序(由高到低)
    ary.sort(function(a,b){
        return b[1]-a[1];
    })

    let otherTotal = 0; //存取 "其他" 品項總營收

    // 除了營收排名前三的品項，其餘品項合併為"其他"
    ary.forEach(function(item,index){
        if(index<3){
            newAry.push(ary[index]);
        }else{
            otherTotal += ary[index][1];
        }
    })
    newAry.push(['其他',otherTotal]);
    return newAry;
}

// 對表單內容綁監聽
orderTable.addEventListener('click', function (e) {
    e.preventDefault();
    const targetClass = e.target.getAttribute("class");
    let id = e.target.dataset.id;

    // 假如點擊到的是"狀態"
    if (targetClass == "js-orderStatus") {
        let status = e.target.dataset.status;
        modifyOrderStatus(id,status);
        return;
    }
    // 假如點擊到的是"刪除""
    if(targetClass == "delSingleOrder-Btn js-deleteItem"){
        deleteOrderItem(id);
        return;
    }
})

// 訂單狀態修改
function modifyOrderStatus(id, status) {
    let updateStatus = (status=="true") ? false : true ; //更新訂單狀態
    axios.put(`${api_URL}/admin/${api_path}/orders`,{
        "data":{
            "id":id,
            "paid":updateStatus
        }
    },{
        headers: {
            'Authorization': token
        }
    })
    .then(function(response) {
        alert("訂單狀態修改 成功");
        getOrderList();
    })
    .catch(function (error) {
        alert("訂單狀態修改 失敗");
    })
}

// 刪除特定(ID)訂單
function deleteOrderItem(id){
    axios.delete(`${api_URL}/admin/${api_path}/orders/${id}`,
      {
        headers: {
            'Authorization' : token
        }
      })
      .then(function(response){
        alert("刪除該筆訂單 成功");
        getOrderList();
      })
      .catch(function(error){
        alert("刪除該筆訂單 失敗");
      })
}

// 刪除全部訂單
discardAllBtn.addEventListener('click',function(e){
    e.preventDefault();
    axios.delete(`${api_URL}/admin/${api_path}/orders`,
    {
        headers:{
            'Authorization' :　token
        }
    })
    .then(function(response){
        alert("刪除全部訂單 成功");
        getOrderList();
    })
    .catch(function(error){
        alert("刪除全部訂單 失敗")
    })
})