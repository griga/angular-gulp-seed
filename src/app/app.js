angular.module('app', [
        'ngAnimate',
        'ngMessages',
        'ngAria',
        'ui.router',
        'ngMaterial',
        'app.layout',
        'app.tripType'
    ])

    .run(()=> {
        
        

        console.log('run')
    })
