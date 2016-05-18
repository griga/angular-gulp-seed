angular.module('app', [
        'ngAnimate',
        'ngMessages',
        'ngAria',
        'ui.router',
        'material.components.input',
        'app.layout',
        'app.tripType'
    ])

    .run(()=> {
        
        

        console.log('run')
    })
