var app = angular.module('root', ["ngRoute"]);

app.config(["$routeProvider", function($routeProvider){
  $routeProvider
  .when('/filter', {
    templateUrl: "views/filter.html"
  }).when("/home",{
    templateUrl: "views/home.html"
  }).otherwise({
    redirectTo: '/home'
  })

}])

app.service("addDataService", function($rootScope){
  this.tempData = {};

  this.setNewData = function (data) {
    this.tempData = data;
    $rootScope.$emit("addDataPassEvent");
  }

  this.getNewData = function () {
    return this.tempData;
  }
});

app.service("editDataService", function($rootScope){
  this.tempFormData = {};

  this.setFormData = function (data) {
    this.tempFormData = data;
    $rootScope.$emit("editFormDataEvent");
  }

  this.getFormData = function () {
    return this.tempFormData;
  }
});

app.controller('employeeAddCtrl', function($scope, $rootScope, $http, addDataService, editDataService) {

  $scope.buttonText = "Add";
  $scope.modeText = "Add";

  $rootScope.$on("editFormDataEvent", function(){
    const editData = editDataService.getFormData();
    $scope.first_name = editData.first_name;
    $scope.last_name = editData.last_name;
    $scope.address = editData.address;
    $scope.age = editData.age;
    $scope.email = editData.email;
    $scope.buttonText = "Update";
    $scope.modeText = "Edit";
  })

  let formError = {
    first_name : "",
    last_name: "",
    address: "",
    age: "",
    email:""
  }

  $scope.backToAdd = function() {
    ["first_name", "last_name", "address", "age", "email"].forEach(key => {
      $scope[key] = "";
      formError[key] = "";
    });

    $scope.buttonText = "Add";
    $scope.modeText = "Add";
  }

  $scope.submit = function () {
    let data = {
      first_name : $scope.first_name,
      last_name: $scope.last_name,
      address: $scope.address,
      age: $scope.age,
      email: $scope.email
    };

    let valid = true;
    angular.forEach(data, function (value, key) {
      if(data[key] === "" || data[key] === null || data[key] === undefined) {
        formError[key] = "This field can not be blank";
        valid = false
      }
    });

    $scope.formError = formError;

    if($scope.modeText === "Add" && valid) {
      $http.post("http://127.0.0.1:8000/api/v1/employee-list/", data)
      .then(function(response) {
        addDataService.setNewData(response.data);
        ["first_name", "last_name", "address", "age", "email"].forEach(key => {
          $scope[key] = "";
        });
        swal("Saved Successfully!", "", "success", {
          button: "ok",
        });
      });
    }

    if($scope.modeText=== "Edit" && valid) {
      const editId = editDataService.getFormData().id;
      $http.patch("http://127.0.0.1:8000/api/v1/employee-detail/"+editId+"/", data)
      .then(function(response) {
        editDataService.setFormData({...data, id: editId});
        swal("Updated Successfully!", "", "success", {
          button: "ok",
        });
      });
    }
  }
});

app.controller('employeeListCtrl', function($scope, $http, $rootScope, addDataService, editDataService) {
  $rootScope.$on("addDataPassEvent",function() {
    var prevData = $scope.employeeList;
    prevData.push(addDataService.getNewData());
    $scope.employeeList = prevData;
  })

  $rootScope.$on("editFormDataEvent",function() {
    const prevData = $scope.employeeList;
    const editId = editDataService.getFormData().id;
    const index = $scope.employeeList.findIndex(x => x.id === editId);
    prevData[index] = editDataService.getFormData();
    $scope.employeeList = prevData;
  })

  $http.get("http://127.0.0.1:8000/api/v1/employee-list/")
  .then(function(response) {
      $scope.employeeList = response.data;
  });

  $scope.delete = function($id) {
    swal({
      title: "Are you sure?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        $http.delete('http://127.0.0.1:8000/api/v1/employee-detail/'+$id+'/').then(function (response) {
        const afterDeletedList = $scope.employeeList.filter(x => x.id != $id);
        $scope.employeeList = afterDeletedList;
      })
        swal("Deleted Successfully", {
          icon: "success",
        });
      } else {
        swal("Not deleted");
      }
    });

  }

  $scope.edit = function($id) {
    const obj = $scope.employeeList.find(x => x.id === $id);
    editDataService.setFormData(obj);
  }
});

app.controller('filterCtrl', function($scope, $http) {
  $http.get("http://127.0.0.1:8000/api/v1/employee-list/")
  .then(function(response) {
      $scope.employeeList = response.data;
  });

});


app.directive('employeeForm', [function(){
  return {
    restrict: "E",
    templateUrl: "views/forms/EmployeeDetailForm.html"
  }
}]);

app.directive("doubleClick", ["editDataService",function(editDataService){
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      element.on('dblclick', function (event) {
        editDataService.setFormData(JSON.parse(attr.doubleClick));
      })
    }
  }
}]);
