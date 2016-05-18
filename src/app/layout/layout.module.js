"use strict";

angular.module('app.layout', ['ui.router'])

    .config(($stateProvider, $urlRouterProvider)=> {
        $stateProvider
            .state('app', {
                abstract: true,
                views: {
                    root: {
                        templateUrl: 'app/layout/views/layout.html',
                        
                    },
                    "header@app": {
                        templateUrl: 'app/layout/views/header.html',

                    },
                    "footer@app": {
                        templateUrl: 'app/layout/views/footer.html'
                    }
                },
              })

        $urlRouterProvider.otherwise('/trip-type');
    });

