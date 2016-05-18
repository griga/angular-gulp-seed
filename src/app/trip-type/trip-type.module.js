/**
 * Created by griga on 5/10/16.
 */

angular.module('app.tripType', [])
    .config(($stateProvider) => {
        $stateProvider
            .state('app.tripType', {
                url: '/trip-type',
                views: {
                    "content@app": {
                        controller: 'TripTypeController as vm',
                        templateUrl: 'app/trip-type/trip-type.html',
                    }
                },
                data: {
                    title: 'Board'
                }
            })

    });