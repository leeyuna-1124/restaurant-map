// 카카오맵
var container = document.getElementById("map"); //지도를 담을 영역의 DOM 레퍼런스
var options = {
  //지도를 생성할 때 필요한 기본 옵션
  center: new kakao.maps.LatLng(37.485677, 126.895534), //지도의 중심좌표. (스타벅스 구로지털단지점)
  level: 3, //지도의 레벨(확대, 축소 정도)
};

var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new kakao.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// kakao.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

/*
**********************************************************
2. 더미데이터 준비하기 (제목, 주소, url, 카테고리)
*/
const dataSet = [
  {
    title: "파파이스",
    address: "서울 구로구 디지털로 306",
    url: "https://www.youtube.com/watch?v=FNlE42t4SjQ",
    category: "양식",
    placeInfo: "https://map.naver.com/v5/search/%ED%8C%8C%ED%8C%8C%EC%9D%B4%EC%8A%A4/place/1663079564?c=13,0,0,0,dh&placePath=%3Fentry%253Dbmp"
  },
  {
    title: "애머이 쌀국수",
    address: "서울 구로구 디지털로31길 12",
    url: "https://www.youtube.com/watch?v=RBRzuSNzZBI",
    category: "기타",
    placeInfo: "https://map.naver.com/v5/search/%EC%95%A0%EB%A8%B8%EC%9D%B4/place/615765252?c=13,0,0,0,dh&placePath=%3Fentry%253Dbmp"
  },
  {
    title: "구로돈가",
    address: "서울 구로구 디지털로27가길 27",
    url: "https://www.youtube.com/watch?v=KQpuT1IrF7k",
    category: "한식",
    placeInfo: "https://map.naver.com/v5/search/%EA%B5%AC%EB%A1%9C%EB%8F%88%EA%B0%80/place/1085551126?c=15,0,0,0,dh&placePath=%3Fentry%253Dbmp"
  },
];

/*
**********************************************************
3. 여러개 마커 찍기
  * 주소 - 좌표 변환
https://apis.map.kakao.com/web/sample/multipleMarkerImage/ (여러개 마커)
https://apis.map.kakao.com/web/sample/addr2coord/ (주소로 장소 표시하기)
*/

// 주소 - 좌표 변환 함수 (비동기 문제 발생 해결) ****************
// 주소-좌표 변환 객체를 생성합니다
var geocoder = new kakao.maps.services.Geocoder();
function getCoordsByAddress(address) {
  // promise 형태로 반환
  return new Promise((resolve, reject) => {
    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(address, function (result, status) {
      // 정상적으로 검색이 완료됐으면
      if (status === kakao.maps.services.Status.OK) {
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        return resolve(coords); //Promise 객체에서 resolve로 넘어온것이 await 구문에 반환된다.(여기서는 position 반환)
      }
      reject(new Error("getCoordsByAddress Error: not valid Address"));
    });
  });
}

/* 
******************************************************************************
4. 마커에 인포윈도우 붙이기
  * 마커에 클릭 이벤트로 인포윈도우 https://apis.map.kakao.com/web/sample/multipleMarkerEvent/
  * url에서 섬네일 따기
  * 클릭한 마커로 지도 센터 이동 https://apis.map.kakao.com/web/sample/moveMap/
*/

//마커 이미지 주소
var imageSrc = "https://www.pngplay.com/wp-content/uploads/12/Clipart-Star-Background-PNG.png";

async function setMap(dataSet) {
  for (var i = 0; i < dataSet.length; i++) {
    let position = await getCoordsByAddress(dataSet[i].address); //return resolve(coords); 에서 넘어옴.

    // 마커 이미지의 이미지 크기 입니다
    var imageSize = new kakao.maps.Size(50, 50);

    // 마커 이미지를 생성합니다
    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    // 마커를 생성합니다
    var marker = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: position, // 마커를 표시할 위치
      image: markerImage,
    });

    markerArray.push(marker);

    // 마커에 표시할 인포윈도우를 생성합니다
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
      disableAutoPan: true, // 인포윈도우를 열 때 지도가 자동으로 패닝하지 않을지의 여부 (기본값: false)
    });

    infowindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    kakao.maps.event.addListener(
      marker,
      "click",
      makeOverListener(map, marker, infowindow, position)
    );
    // 커스텀: 맵을 클릭하면 현재 나타난 인포윈도우가 없어지게끔
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
}

// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
/* 
  커스텀
  1. 클릭시 다른 인포윈도우 닫기
  2. 클릭한 곳으로 지도 중심 이동하기
  */

function makeOverListener(map, marker, infowindow, position) {
  return function () {
    // 1. 클릭시 다른 인포윈도우 닫기
    closeInfowindow();
    infowindow.open(map, marker);
    // 2. 클릭한 곳으로 짇 중심 이동하기
    map.panTo(position);
  };
}

// 커스텀
// 1. 클릭시 다른 인포윈도우 닫기
let infowindowArray = [];
function closeInfowindow() {
  for (let infowindow of infowindowArray) {
    infowindow.close();
  }
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}

// HTML 코드로 바꾸는 함수
function getContent(data) {
  let videoId = "";
  let replaceUrl = data.url;
  replaceUrl = replaceUrl.replace("https://youtu.be/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/embed/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/watch?v=", "");
  videoId = replaceUrl.split("&")[0];

  const result = `
  <div class="infowindow">
    <div class="infowindow-img-container">
      <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" class="infowindow-img" alt="...">
    </div>
    <div class="infowindow-body">
        <h5 class="infowindow-title">${data.title}</h5>
        <p class="infowindow-address">${data.address}</p>
        <a href="${data.url}" target="_blank" class="infowindow-btn">영상 이동</a>&nbsp&nbsp&nbsp&nbsp&nbsp
        <a href="${data.placeInfo}" target="_blank" class="infowindow-btn">장소 정보</a>
    </div>
  </div>`;

  return result;
}

/*
**********************************************
5. 카테고리 분류
*/
// 카테고리
const categoryMap = {
  korea: "한식",
  china: "중식",
  japan: "일식",
  america: "양식",
  wheat: "분식",
  meat: "구이",
  etc: "기타",
  all: "전체",
};

const categoryList = document.querySelector(".category-list");
categoryList.addEventListener("click", categoryHandler);

function categoryHandler(event){
  const categoryId = event.target.id;
  const category = categoryMap[categoryId];
  
  if(categoryId !== "all") {
    //데이터 분류
    let categorizedDataSet = [];
    for(let data of dataSet) {
      if(data.category === category) {
        categorizedDataSet.push(data);
      }
    }
    //기존 마커 삭제
    closeMarker();
    
    //기존 인포윈도우 닫기
    closeInfowindow();
    
    setMap(categorizedDataSet);
    
  }else {
    setMap(dataSet); // "전체" 카테고리를 선택했을 경우
  }
}

let markerArray = [];
function closeMarker() {
  for(marker of markerArray){
    marker.setMap(null);
  }
}

setMap(dataSet);