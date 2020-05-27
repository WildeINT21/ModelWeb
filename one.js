/* global THREE */
/* global webots */


//Motor回调函数
function sliderMotorCallback(transform, slider, value) {
    if (typeof transform === 'undefined')
        return;

    var axis = slider.getAttribute('webots-axis').split(/[\s,]+/);
    axis = new THREE.Vector3(parseFloat(axis[0]), parseFloat(axis[1]), parseFloat(axis[2]));

    var position = parseFloat(slider.getAttribute('position'));
    var initialPosition = parseFloat(slider.getAttribute('initial-position'));

    if (slider.getAttribute('webots-type') === 'LinearMotor') {
        // Compute translation
        var translation = new THREE.Vector3();
        if ('initialTranslation' in transform.userData)
            translation = transform.userData.initialTranslation.clone();
        else {
            translation = transform.position;
            transform.userData.initialTranslation = translation.clone();
        }
        translation = translation.add(axis.multiplyScalar(value - position));
        // Apply the new position.
        transform.position.copy(translation);
        transform.updateMatrix();
    } else {
        // Compute angle.
        var angle = initialPosition;
        angle += value - position;
        // Apply the new axis-angle.
        var q = new THREE.Quaternion();
        q.setFromAxisAngle(
            axis,
            angle
        );
        transform.quaternion.copy(q);
        transform.updateMatrix();
    }
}

function isInternetExplorer() {
    var userAgent = navigator.userAgent;
    return userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident') !== -1;
};


var MotorValue = {};

//Motor监听函数
function listenMotor(view,Motor) {
    Object.defineProperties(MotorValue, {
        Door: {
            set: function (value_) {
                var id = "n47";
                sliderMotorCallback(view.x3dScene.getObjectById(id, true), Motor[0], value_);
                view.x3dScene.render();
            }
        },
        Spindle: {
            set: function (value_) {
                var id = "n106";
                sliderMotorCallback(view.x3dScene.getObjectById(id, true), Motor[1], value_);
                view.x3dScene.render();
            }
        },
        Xaxis: {
            set: function (value_) {
                var id = "n94";
                sliderMotorCallback(view.x3dScene.getObjectById(id, true), Motor[2], value_);
                view.x3dScene.render();
            }
        },
        Zaxis: {
            set: function (value_) {
                var id = "n85";
                sliderMotorCallback(view.x3dScene.getObjectById(id, true), Motor[3], value_);
                view.x3dScene.render();
            }
        }
    });
}

//组件加载
function init() {
   var view = new webots.View(document.getElementById("view3d"));
    //打开相应的x3d文件
    view.open("lathe.x3d");

    //异步获取json文件用以创建相应的系统组件
    $.ajax({
        type: 'GET',
        url: 'latheProperty.json',
        dataType: 'text',
        success: function (content) {

            var deviceComponent = document.getElementById("motorSlider");
            var data = JSON.parse(content);
            var categories = {};
            var Motor = new Array(4);

            //设置相应变量的监听

            //获取组件
            for (var d = 0; d < data['devices'].length; d++) {
                var device = data['devices'][d];
                // var deviceName = device['name'];
                var deviceType = device['type'];

                if (deviceType.endsWith('Motor') && !device['track']) {
                    Motor[d] = document.createElement('input');
                    Motor[d].classList.add('motor');
                    if (device['minPosition'] === device['maxPosition']) { // infinite range.
                        Motor[d].setAttribute('min', -Math.PI);
                        Motor[d].setAttribute('max', Math.PI);
                    } else { // fixed range.
                        var epsilon = 0.000001; // To solve Windows browser bugs on slider when perfectly equals to 0.
                        Motor[d].setAttribute('min', device['minPosition'] - epsilon);
                        Motor[d].setAttribute('max', device['maxPosition'] + epsilon);
                    }
                    Motor[d].setAttribute('position', device['position']);
                    Motor[d].setAttribute('initial-position', device['initialPosition']);
                    Motor[d].setAttribute('webots-transform-id', device['transformID']);
                    Motor[d].setAttribute('name', device['name']);
                    Motor[d].setAttribute('webots-axis', device['axis']);
                    Motor[d].setAttribute('webots-type', deviceType);
                    // console.log(Motor.getAttribute('webots-type'));
                    var name = device['name'];
                    MotorValue.name=device['initialPosition'];
                }


            }
            listenMotor(view,Motor);
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            console.log('Status: ' + textStatus);
            console.log('Error: ' + errorThrown);
        }
    })

}

//读取外部json获取更新,刷新率1000ms
$(document).ready(
    function () {
        $("#button").click(
            function () {
                setInterval("upDate()",1000);
            }
        )
    }
)

function upDate(){
    $.ajax({
        url: 'latheData.json',
        dataType: 'json',
        async:true,
        data:{"device":"value"},
        type:"GET",
        success: function (data) {
            MotorValue.Door =data[0]['value'];
            MotorValue.Spindle=data[1]['value'];
            MotorValue.Xaxis=data[2]['value'];
            MotorValue.Zaxis=data[3]['value'];
        },
        error:function (XMLHttpRequest, textStatus, errorThrown) {
            console.log('Status: ' + textStatus);
            console.log('Error: ' + errorThrown);
        }
    })
}


window.addEventListener("load", init, false);


if (location.protocol == "file:" && (!!window.chrome && !!window.chrome.webstore))
    alert("Webots HTML5 Models and Animations cannot be loaded locally on Google Chrome, as Chrome does not support cross-origin requests using the file:// protocol.");




