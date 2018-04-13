'use strict';

var request = require('request');
var rp = require('request-promise');
var Cookie = require('request-cookies').Cookie;
var tough = require('tough-cookie');
var awsParamEnv = require('aws-param-env');

var token;
var session;

console.log('Loading function');
console.log('Loading variables from parameter store...');
awsParamEnv.load('/', {region: 'us-east-2'});

//console.log(process.env);

//console.log('aisleplanner_user=%j', process.env.aisleplanner_user);

//var todayDate = new Date();
//todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
//todayDate.toISOString().slice(0,10);

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    event.Records.forEach((record) => {
        //console.log(record.eventID);
        //console.log(record.eventName);
        //console.log(record.name);
        console.log('DynamoDB Record: %j', record.dynamodb);
        if(record.dynamodb.hasOwnProperty('NewImage')){
            //console.log('======NEW INFO======');
            var name = record.dynamodb.NewImage.name.S;
            var fullName = name.trim();
            //check if given first name and last name
            if(fullName.indexOf(' ') >= 0){
                //let firstName be string up to first space
                //let lastName be string of everything else
                //if no spaces, lastName is name, firstName is empty
                var firstName = fullName.substr(0,fullName.indexOf(' '));
                var lastName = fullName.substr(fullName.indexOf(' ')+1);
                //console.log('firstName: %j', firstName);
                //console.log('lastName: %j', lastName);
            }
            //console.log('fullName: %j', fullName);
            if(record.dynamodb.NewImage.hasOwnProperty('email')){
                var email = record.dynamodb.NewImage.email.S;
                //console.log('Email: %j', email);
            }
            var attending = record.dynamodb.NewImage.attending.N;
            //console.log('Attending: %j', attending);
            if(record.dynamodb.NewImage.hasOwnProperty('guests')){
                var guests = record.dynamodb.NewImage.guests.S;
                //console.log('Guests: %j', guests);
                //check if more than 1 guest
                if(guests.indexOf(',') >= 0){
                    //console.log('Getting info for Guest1');
                    var guest1FullName = guests.substr(0,guests.indexOf(',')).trim();
                    var guest1FirstName = guest1FullName.substr(0,guest1FullName.indexOf(' '));
                    var guest1LastName = guest1FullName.substr(guest1FullName.indexOf(' ')+1);
                    
                    var remainingGuestList1 = guests.substr(guests.indexOf(',')+1).trim();
                    if(remainingGuestList1.indexOf(',') >= 0){
                        //get 2nd guest info
                        //console.log('Getting info for Guest2');
                        var guest2FullName = remainingGuestList1.substr(0,remainingGuestList1.indexOf(',')).trim();
                        var guest2FirstName = guest2FullName.substr(0,guest2FullName.indexOf(' '));
                        var guest2LastName = guest2FullName.substr(guest2FullName.indexOf(' ')+1);
                    
                        var remainingGuestList2 = remainingGuestList1.substr(remainingGuestList1.indexOf(',')+1).trim();
                        if(remainingGuestList2.indexOf(',') >= 0){
                            //get 3rd guest info
                            //console.log('Getting info for Guest3');
                            var guest3FullName = remainingGuestList2.substr(0,remainingGuestList2.indexOf(',')).trim();
                            var guest3FirstName = guest3FullName.substr(0,guest3FullName.indexOf(' '));
                            var guest3LastName = guest3FullName.substr(guest3FullName.indexOf(' ')+1);
                            
                            var remainingGuestList3 = remainingGuestList2.substr(remainingGuestList2.indexOf(',')+1).trim();
                            if(remainingGuestList3.indexOf(',') >= 0){
                                //get 4th guest info
                                //console.log('Getting info for Guest4');
                                console.log('WARNING: more than 4 guests found, dropping others');
                                var guest4FullName = remainingGuestList3.substr(0,remainingGuestList3.indexOf(',')).trim();
                                var guest4FirstName = guest4FullName.substr(0,guest4FullName.indexOf(' '));
                                var guest4LastName = guest4FullName.substr(guest4FullName.indexOf(' ')+1);
                                var numGuests = 4;
                            } else {
                                //only 4 guests (not allowing more)
                                //console.log('Found 4 guests');
                                var guest4FullName = remainingGuestList3.substr(remainingGuestList3.indexOf(',')+1).trim();
                                var guest4FirstName = guest4FullName.substr(0,guest4FullName.indexOf(' '));
                                var guest4LastName = guest4FullName.substr(guest4FullName.indexOf(' ')+1);
                                var numGuests = 4;
                            }//only 4 guests
                        } else {
                            //only 3 guests
                            //console.log('Found 3 guests');
                            var guest3FullName = remainingGuestList2.substr(remainingGuestList2.indexOf(',')+1).trim();
                            var guest3FirstName = guest3FullName.substr(0,guest3FullName.indexOf(' '));
                            var guest3LastName = guest3FullName.substr(guest3FullName.indexOf(' ')+1);
                            var numGuests = 3;
                        }//only 3 guests
                    } else {
                        //only 2 guests
                        //console.log('Found 2 guests');
                        var guest2FullName = remainingGuestList1.substr(remainingGuestList1.indexOf(',')+1).trim();
                        var guest2FirstName = guest2FullName.substr(0,guest2FullName.indexOf(' '));
                        var guest2LastName = guest2FullName.substr(guest2FullName.indexOf(' ')+1);
                        var numGuests = 2;
                    }//only 2 guests
                    
                } else {
                    //only 1 guest
                    //console.log('Found 1 guest');
                    var guest1FullName = guests.substr(guests.indexOf(',')+1).trim();
                    var guest1FirstName = guest1FullName.substr(0,guest1FullName.indexOf(' '));
                    var guest1LastName = guest1FullName.substr(guest1FullName.indexOf(' ')+1);
                    var numGuests = 1;
                }//only 1 guest
            } else {
                //no additional guests
                //console.log('Found 0 additional guests');
                var numGuests = 0;
            }
        }//if has NewImage
        /*if(record.dynamodb.hasOwnProperty('OldImage')){
            //console.log('======OLD INFO======');
            var oldName = record.dynamodb.OldImage.name.S;
            var oldFullName = oldName.trim();
            //check if given first name and last name
            if(oldFullName.indexOf(' ') >= 0){
                //let firstName be string up to first space
                //let lastName be string of everything else
                //if no spaces, lastName is name, firstName is empty
                var oldFirstName = oldFullName.substr(0,oldFullName.indexOf(' '));
                var oldLastName = oldFullName.substr(oldFullName.indexOf(' ')+1);
                //console.log('oldFirstName: %j', oldFirstName);
                //console.log('oldLastName: %j', oldLastName);
            }
            //console.log('oldFullName: %j', oldFullName);
            if(record.dynamodb.OldImage.hasOwnProperty('email')){
                var oldEmail = record.dynamodb.OldImage.email.S;
                //console.log('Email: %j', oldEmail);
            }
            var oldAttending = record.dynamodb.OldImage.attending.N;
            //console.log('Attending: %j', oldAttending);
            if(record.dynamodb.OldImage.hasOwnProperty('guests')){
                var oldGuests = record.dynamodb.OldImage.guests.S;
                //console.log('Guests: %j', oldGuests);
                //check if more than 1 guest
                if(oldGuests.indexOf(',') >= 0){
                    console.log("Getting info for old Guest1");
                    var oldGuest1FullName = oldGuests.substr(0,oldGuests.indexOf(',')).trim();
                    var oldGuest1FirstName = oldGuest1FullName.substr(0,oldGuest1FullName.indexOf(' '));
                    var oldGuest1LastName = oldGuest1FullName.substr(oldGuest1FullName.indexOf(' ')+1);
                    
                    var oldRemainingGuestList1 = oldGuests.substr(oldGuests.indexOf(',')+1).trim();
                    if(oldRemainingGuestList1.indexOf(',') >= 0){
                        //get 2nd guest info
                        console.log("Getting info for old Guest2");
                        var oldGuest2FullName = oldRemainingGuestList1.substr(0,oldRemainingGuestList1.indexOf(',')).trim();
                        var oldGuest2FirstName = oldGuest2FullName.substr(0,oldGuest2FullName.indexOf(' '));
                        var oldGuest2LastName = oldGuest2FullName.substr(oldGuest2FullName.indexOf(' ')+1);
                    
                        var oldRemainingGuestList2 = oldRemainingGuestList1.substr(oldRemainingGuestList1.indexOf(',')+1).trim();
                        if(oldRemainingGuestList2.indexOf(',') >= 0){
                            //get 3rd guest info
                            console.log("Getting info for old Guest3");
                            var oldGuest3FullName = oldRemainingGuestList2.substr(0,oldRemainingGuestList2.indexOf(',')).trim();
                            var oldGuest3FirstName = oldGuest3FullName.substr(0,oldGuest3FullName.indexOf(' '));
                            var oldGuest3LastName = oldGuest3FullName.substr(oldGuest3FullName.indexOf(' ')+1);
                            
                            var oldRemainingGuestList3 = oldRemainingGuestList2.substr(oldRemainingGuestList2.indexOf(',')+1).trim();
                            if(oldRemainingGuestList3.indexOf(',') >= 0){
                                //get 4th guest info
                                console.log("Getting info for old Guest4");
                                console.log("WARNING: more than 4 guests found, dropping others");
                                var oldGuest4FullName = oldRemainingGuestList3.substr(0,oldRemainingGuestList3.indexOf(',')).trim();
                                var oldGuest4FirstName = oldGuest4FullName.substr(0,oldGuest4FullName.indexOf(' '));
                                var oldGuest4LastName = oldGuest4FullName.substr(oldGuest4FullName.indexOf(' ')+1);
                            } else {
                                //only 4 guests (not allowing more)
                                console.log("Found 4 guests");
                                var oldGuest4FullName = oldRemainingGuestList3.substr(oldRemainingGuestList3.indexOf(',')+1).trim();
                                var oldGuest4FirstName = oldGuest4FullName.substr(0,oldGuest4FullName.indexOf(' '));
                                var oldGuest4LastName = oldGuest4FullName.substr(oldGuest4FullName.indexOf(' ')+1);
                            }//only 4 guests
                        } else {
                            //only 3 guests
                            console.log('Found 3 guests');
                            var oldGuest3FullName = oldRemainingGuestList2.substr(oldRemainingGuestList2.indexOf(',')+1).trim();
                            var oldGuest3FirstName = oldGuest3FullName.substr(0,oldGuest3FullName.indexOf(' '));
                            var oldGuest3LastName = oldGuest3FullName.substr(oldGuest3FullName.indexOf(' ')+1);
                        }//only 3 guests
                    } else {
                        //only 2 guests
                        console.log("Found 2 guests");
                        var oldGuest2FullName = oldRemainingGuestList1.substr(oldRemainingGuestList1.indexOf(',')+1).trim();
                        var oldGuest2FirstName = oldGuest2FullName.substr(0,oldGuest2FullName.indexOf(' '));
                        var oldGuest2LastName = oldGuest2FullName.substr(oldGuest2FullName.indexOf(' ')+1);
                        
                    }//only 2 guests
                    
                } else {
                    //only 1 guest
                    console.log("Found 1 guest");
                    var oldGuest1FullName = oldGuests.substr(oldGuests.indexOf(',')+1).trim();
                    var oldGuest1FirstName = oldGuest1FullName.substr(0,oldGuest1FullName.indexOf(' '));
                    var oldGuest1LastName = oldGuest1FullName.substr(oldGuest1FullName.indexOf(' ')+1);
                }//only 1 guest
            }//if any guests
        }//if has OldImage
        */

        switch(record.eventName) {
            case "INSERT":
                // Adding a net new entry
                // AislePlanner cares about:
                //     FirstName
                //     LastName
                //     Response
                /*
                console.log("INSERT TO AISLEPLANNER");
                console.log('======NEW INFO======');
                if (typeof email !== 'undefined') {
                    console.log("new Email: %j", email);
                }
                if (typeof attending !== 'undefined') {
                    console.log("new Atttending: %j", attending);
                }
                if (typeof fullName !== 'undefined') {
                    console.log("new fullName: %j, firstName: %j, lastName: %j", fullName, firstName, lastName);
                }
                if (typeof guest1FullName !== 'undefined') {
                    console.log("new guest1FullName: %j, guest1FirstName: %j, guest1LastName: %j", guest1FullName, guest1FirstName, guest1LastName);
                }
                if (typeof guest2FullName !== 'undefined') {
                    console.log("new guest2FullName: %j, guest2FirstName: %j, guest2LastName: %j", guest2FullName, guest2FirstName, guest2LastName);
                }
                if (typeof guest3FullName !== 'undefined') {
                    console.log("new guest3FullName: %j, guest3FirstName: %j, guest3LastName: %j", guest3FullName, guest3FirstName, guest3LastName);
                }
                if (typeof guest4FullName !== 'undefined') {
                    console.log("new guest4FullName: %j, guest4FirstName: %j, guest4LastName: %j", guest4FullName, guest4FirstName, guest4LastName);
                }
                */
                /*console.log('======OLD INFO======');
                if (typeof oldEmail !== 'undefined') {
                    console.log("old Email: %j", oldEmail);
                }
                if (typeof oldAttending !== 'undefined') {
                    console.log("old Attending: %j", oldAttending);
                }
                if (typeof oldFullName !== 'undefined') {
                    console.log("old fullName: %j, firstName: %j, lastName: %j", oldFullName, oldFirstName, oldLastName);
                }
                if (typeof oldGuest1FullName !== 'undefined') {
                    console.log("old guest1FullName: %j, guest1FirstName: %j, guest1LastName: %j", oldGuest1FullName, oldGuest1FirstName, oldGuest1LastName);
                }
                if (typeof oldGuest2FullName !== 'undefined') {
                    console.log("old guest2FullName: %j, guest2FirstName: %j, guest2LastName: %j", oldGuest2FullName, oldGuest2FirstName, oldGuest2LastName);
                }
                if (typeof oldGuest3FullName !== 'undefined') {
                    console.log("old guest3FullName: %j, guest3FirstName: %j, guest3LastName: %j", oldGuest3FullName, oldGuest3FirstName, oldGuest3LastName);
                }
                if (typeof oldGuest4FullName !== 'undefined') {
                    console.log("old guest4FullName: %j, guest4FirstName: %j, guest4LastName: %j", oldGuest4FullName, oldGuest4FirstName, oldGuest4LastName);
                }
                */
                
                //for each new user + guests
                //  if exists && attending != oldAttending
                //      update existing
                //  else
                //      write new entry
                
                //write new entry for now
                var options = {
                    uri: 'https://www.aisleplanner.com',
                    json: true, 
                    simple: false,
                    resolveWithFullResponse: true 
                };

                rp(options)
                    .then(function (response) {
                        //console.log('Response: %j', response);
                        var rawcookies = response.headers['set-cookie'];
                        for (var i in rawcookies) {
                            var cookie = new Cookie(rawcookies[i]);
                            switch(cookie.key) {
                                case "XSRF-TOKEN":
                                    //console.log("Found XSRF-TOKEN: %j, expires: %j", cookie.value, cookie.expires);
                                    token = cookie.value;
                                    break;
                                case "session":
                                    //console.log("Found session: %j, expires: %j", cookie.value, cookie.expires);
                                    session = cookie.value;
                                    break;
                                default:
                                    console.log("Found auxillary %j: %j, expires: %j", cookie.key, cookie.value, cookie.expires);
                            }
                        }
                        
                        //create necessary cookies
                        let cookieDelayedPopup = new tough.Cookie({
                            key: "delayed-popup-opened",
                            value: "true",
                            domain: 'www.aisleplanner.com',
                            httpOnly: true,
                            maxAge: 31556926
                        });
                        
                        let cookieToken = new tough.Cookie({
                            key: "XSRF-TOKEN",
                            value: token,
                            domain: 'www.aisleplanner.com',
                            httpOnly: true,
                            maxAge: 604800 
                        });
                        
                        let cookieSession = new tough.Cookie({
                            key: "session",
                            value: session,
                            domain: 'www.aisleplanner.com',
                            httpOnly: true,
                            maxAge: Infinity
                        });
                        
                        // store in cookie jar to be used in all future requests
                        var cookiejar = rp.jar();
                        cookiejar.setCookie(cookieDelayedPopup, 'https://www.aisleplanner.com');
                        cookiejar.setCookie(cookieToken, 'https://www.aisleplanner.com');
                        cookiejar.setCookie(cookieSession, 'https://www.aisleplanner.com');
                        
                        //login
                        var signinOptions = {
                            method: 'POST',
                            uri: 'https://www.aisleplanner.com/api/account/signin',
                            body: {
                                destination_url: 'https://www.aisleplanner.com/',
                                username: process.env.aisleplanner_user,
                                password: process.env.aisleplanner_pw
                            },
                            headers: {
                                'Host': 'www.aisleplanner.com',
                                'Connection': 'keep-alive',
                                'Accept': 'application/json, text/plain, */*',
                                'Origin': 'https://www.aisleplanner.com',
                                'X-XSRF-TOKEN': token,
                                'X-Requested-With': 'XMLHttpRequest',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Referer': 'https://www.aisleplanner.com/',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                            },
                            jar: cookiejar,
                            json: true // Automatically stringifies the body to JSON
                        };

                        rp(signinOptions)
                            .then(function (signinOptions) {
                                //console.log("signin successful!");
                                //console.log("adding guest first name: %j last name: %j", firstName, lastName);
                                //add guest
                                var addPrimaryOptions = {
                                    method: 'POST',
                                    uri: 'https://www.aisleplanner.com/api/wedding/60620/guest_groups?guests=true',
                                    body: {
                                        group: {},
                                        guests: [{"first_name":firstName,"last_name":lastName,"is_primary_guest":true,"group_order":0}],"events":["266429","266430"]
                                    },
                                    headers: {
                                        'Host': 'www.aisleplanner.com',
                                        'Connection': 'keep-alive',
                                        'Origin': 'https://www.aisleplanner.com',
                                        'X-XSRF-TOKEN': token,
                                        //'X-AP-API-Version': todayDate,
                                        'X-Requested-With': 'XMLHttpRequest',
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                        'Content-Type': 'application/json;charset=UTF-8',
                                        'Accept': 'application/json, text/plain, */*',
                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                        'Accept-Encoding': 'gzip, deflate, br',
                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                    },
                                    jar: cookiejar,
                                    json: true // Automatically stringifies the body to JSON
                                };

                                rp(addPrimaryOptions)
                                    .then(function (addPrimaryBody) {
                                        console.log("guest %j %j was added successfully!", firstName, lastName);
                                        //console.log("addPrimaryBody: %j", addPrimaryBody);
                                        var guestId = addPrimaryBody.guests[0].id;
                                        //console.log("%j %j has user id: %j", firstName, lastName, guestId);
                                        // set attending rsvp status for bongsky
                                        //console.log("setting rsvp status %s %s is: %j", firstName, lastName, attending);
                                        var aisleplannerPrimaryAttending = (attending == "1") ? "attending" : "declined";
                                        var updatePrimaryAttendingOptions = {
                                            method: 'PUT',
                                            uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266429/guests/' + guestId,
                                            body: {
                                                wedding_guest_id: guestId,
                                                guest_list: 1,
                                                responded_on: null,
                                                meal_option_id: null,
                                                meal_declined: false,
                                                invitation_sent_on: null,
                                                notes: "",
                                                requires_transportation: false,
                                                wedding_event_id: "266429",
                                                attending_status: aisleplannerPrimaryAttending,
                                                _effective_meal_option_id: null
                                            },
                                            headers: {
                                                'Host': 'www.aisleplanner.com',
                                                'Connection': 'keep-alive',
                                                'Origin': 'https://www.aisleplanner.com',
                                                'X-XSRF-TOKEN': token,
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                'Content-Type': 'application/json;charset=UTF-8',
                                                'Accept': 'application/json, text/plain, */*',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                'Accept-Encoding': 'gzip, deflate, br',
                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                            },
                                            jar: cookiejar,
                                            json: true // Automatically stringifies the body to JSON
                                        };

                                        rp(updatePrimaryAttendingOptions)
                                            .then(function (updatePrimaryAttendingBody) {
                                                console.log("guest %j %j rsvp status was added successfully!", firstName, lastName);
                                                //console.log("updatePrimaryAttendingBody: %j", updatePrimaryAttendingBody);
                                                // set attending status for Claudia Cole
                                                //console.log("repeat setting rsvp status %j %j is: %j", firstName, lastName, attending);
                                                var updatePrimaryAttendingRepeatOptions = {
                                                    method: 'PUT',
                                                    uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266430/guests/' + guestId,
                                                    body: {
                                                        wedding_guest_id: guestId,
                                                        guest_list: 1,
                                                        responded_on: null,
                                                        meal_option_id: null,
                                                        meal_declined: false,
                                                        invitation_sent_on: null,
                                                        notes: "",
                                                        requires_transportation: false,
                                                        wedding_event_id: "266430",
                                                        attending_status: aisleplannerPrimaryAttending,
                                                        _effective_meal_option_id: null
                                                    },
                                                    headers: {
                                                        'Host': 'www.aisleplanner.com',
                                                        'Connection': 'keep-alive',
                                                        'Origin': 'https://www.aisleplanner.com',
                                                        'X-XSRF-TOKEN': token,
                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                        'Content-Type': 'application/json;charset=UTF-8',
                                                        'Accept': 'application/json, text/plain, */*',
                                                        'X-Requested-With': 'XMLHttpRequest',
                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                    },
                                                    jar: cookiejar,
                                                    json: true // Automatically stringifies the body to JSON
                                                };

                                                rp(updatePrimaryAttendingRepeatOptions)
                                                    .then(function (updatePrimaryAttendingRepeatBody) {
                                                        console.log("guest %j %j rsvp status was added successfully again!", firstName, lastName);
                                                        //console.log("updatePrimaryAttendingRepeatBody: %j", updatePrimaryAttendingRepeatBody);
                                                        //console.log("GREAT SUCCESS!");
                                                        //console.log("Time to add guests...");
                                                        if(numGuests <= 0) {
                                                            //console.log("no additional guests, signing out...");
                                                            //signout
                                                            console.log("signing out...");
            
                                                            var signoutOptions = {
                                                                uri: 'https://www.aisleplanner.com/signout',
                                                                headers: {
                                                                    'Host': 'www.aisleplanner.com',
                                                                    'Connection': 'keep-alive',
                                                                    'Upgrade-Insecure-Requests': '1',
                                                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                    'X-XSRF-TOKEN': token,
                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                    'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                    'Accept-Encoding': 'gzip, deflate, br',
                                                                    'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                },
                                                                jar: cookiejar,
                                                                json: true // Automatically stringifies the body to JSON
                                                            };

                                                            rp(signoutOptions)
                                                                .then(function (signoutBody) {
                                                                    console.log("signout succeeded!");
                                                                    //END
                                                                })
                                                                .catch(function (signoutErr) {
                                                                    console.log("signout failed! error: %j", signoutErr);
                                                                });
                                                        } else {
                                                            console.log("adding guest first name: %j last name: %j", guest1FirstName, guest1LastName);
                                                            //add guest
                                                            var addGuest1Options = {
                                                                method: 'POST',
                                                                uri: 'https://www.aisleplanner.com/api/wedding/60620/guest_groups?guests=true',
                                                                body: {
                                                                    group: {},
                                                                    guests: [{"first_name":guest1FirstName,"last_name":guest1LastName,"is_primary_guest":true,"group_order":0}],"events":["266429","266430"]
                                                                },
                                                                headers: {
                                                                    'Host': 'www.aisleplanner.com',
                                                                    'Connection': 'keep-alive',
                                                                    'Origin': 'https://www.aisleplanner.com',
                                                                    'X-XSRF-TOKEN': token,
                                                                    //'X-AP-API-Version': todayDate,
                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                    'Content-Type': 'application/json;charset=UTF-8',
                                                                    'Accept': 'application/json, text/plain, */*',
                                                                    'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                    'Accept-Encoding': 'gzip, deflate, br',
                                                                    'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                },
                                                                jar: cookiejar,
                                                                json: true // Automatically stringifies the body to JSON
                                                            };

                                                            rp(addGuest1Options)
                                                                .then(function (addGuest1Body) {
                                                                    console.log("guest %j %j was added successfully!", guest1FirstName, guest1LastName);
                                                                    //console.log("addGuest1Body: %j", addGuest1Body);
                                                                    var guest1Id = addGuest1Body.guests[0].id;
                                                                    //console.log("%j %j has user id: %j", guest1FirstName, guest1LastName, guest1Id);
                                                                    // set attending rsvp status for bongsky
                                                                    //console.log("setting rsvp status %s %s is: %j", guest1FirstName, guest1LastName, attending);
                                                                    //var aisleplannerPrimaryAttending = (attending == "1") ? "attending" : "declined";
                                                                    var updateGuest1AttendingOptions = {
                                                                        method: 'PUT',
                                                                        uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266429/guests/' + guest1Id,
                                                                        body: {
                                                                            wedding_guest_id: guest1Id,
                                                                            guest_list: 1,
                                                                            responded_on: null,
                                                                            meal_option_id: null,
                                                                            meal_declined: false,
                                                                            invitation_sent_on: null,
                                                                            notes: "",
                                                                            requires_transportation: false,
                                                                            wedding_event_id: "266429",
                                                                            attending_status: aisleplannerPrimaryAttending,
                                                                            _effective_meal_option_id: null
                                                                        },
                                                                        headers: {
                                                                            'Host': 'www.aisleplanner.com',
                                                                            'Connection': 'keep-alive',
                                                                            'Origin': 'https://www.aisleplanner.com',
                                                                            'X-XSRF-TOKEN': token,
                                                                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                            'Content-Type': 'application/json;charset=UTF-8',
                                                                            'Accept': 'application/json, text/plain, */*',
                                                                            'X-Requested-With': 'XMLHttpRequest',
                                                                            'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                            'Accept-Encoding': 'gzip, deflate, br',
                                                                            'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                        },
                                                                        jar: cookiejar,
                                                                        json: true // Automatically stringifies the body to JSON
                                                                    };

                                                                    rp(updateGuest1AttendingOptions)
                                                                        .then(function (updateGuest1AttendingBody) {
                                                                            console.log("guest %j %j rsvp status was added successfully!", guest1FirstName, guest1LastName);
                                                                            //console.log("updateGuest1AttendingBody: %j", updateGuest1AttendingBody);
                                                                            // set attending status for Claudia Cole
                                                                            //console.log("repeat setting rsvp status %j %j is: %j", guest1FirstName, guest1LastName, attending);
                                                                            var updateGuest1AttendingRepeatOptions = {
                                                                                method: 'PUT',
                                                                                uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266430/guests/' + guest1Id,
                                                                                body: {
                                                                                    wedding_guest_id: guest1Id,
                                                                                    guest_list: 1,
                                                                                    responded_on: null,
                                                                                    meal_option_id: null,
                                                                                    meal_declined: false,
                                                                                    invitation_sent_on: null,
                                                                                    notes: "",
                                                                                    requires_transportation: false,
                                                                                    wedding_event_id: "266430",
                                                                                    attending_status: aisleplannerPrimaryAttending,
                                                                                    _effective_meal_option_id: null
                                                                                },
                                                                                headers: {
                                                                                    'Host': 'www.aisleplanner.com',
                                                                                    'Connection': 'keep-alive',
                                                                                    'Origin': 'https://www.aisleplanner.com',
                                                                                    'X-XSRF-TOKEN': token,
                                                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                    'Content-Type': 'application/json;charset=UTF-8',
                                                                                    'Accept': 'application/json, text/plain, */*',
                                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                                    'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                    'Accept-Encoding': 'gzip, deflate, br',
                                                                                    'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                },
                                                                                jar: cookiejar,
                                                                                json: true // Automatically stringifies the body to JSON
                                                                            };

                                                                            rp(updateGuest1AttendingRepeatOptions)
                                                                                .then(function (updateGuest1AttendingRepeatBody) {
                                                                                    console.log("guest %j %j rsvp status was added successfully again!", guest1FirstName, guest1LastName);
                                                                                    //console.log("updateGuest1AttendingRepeatBody: %j", updateGuest1AttendingRepeatBody);
                                                                                    //console.log("GREAT SUCCESS!");
                                                                                    if(numGuests <= 1) {
                                                                                        //console.log("no additional guests, signing out...");
                                                                                        //signout
                                                                                        console.log("signing out...");
                                        
                                                                                        var signoutOptions = {
                                                                                            uri: 'https://www.aisleplanner.com/signout',
                                                                                            headers: {
                                                                                                'Host': 'www.aisleplanner.com',
                                                                                                'Connection': 'keep-alive',
                                                                                                'Upgrade-Insecure-Requests': '1',
                                                                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                                                'X-XSRF-TOKEN': token,
                                                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                            },
                                                                                            jar: cookiejar,
                                                                                            json: true // Automatically stringifies the body to JSON
                                                                                        };

                                                                                        rp(signoutOptions)
                                                                                            .then(function (signoutBody) {
                                                                                                console.log("signout succeeded!");
                                                                                                //END
                                                                                            })
                                                                                            .catch(function (signoutErr) {
                                                                                                console.log("signout failed! error: %j", signoutErr);
                                                                                            });
                                                                                    } else {
                                                                                        console.log("adding guest first name: %j last name: %j", guest2FirstName, guest2LastName);
                                                                                        //add guest
                                                                                        var addGuest2Options = {
                                                                                            method: 'POST',
                                                                                            uri: 'https://www.aisleplanner.com/api/wedding/60620/guest_groups?guests=true',
                                                                                            body: {
                                                                                                group: {},
                                                                                                guests: [{"first_name":guest2FirstName,"last_name":guest2LastName,"is_primary_guest":true,"group_order":0}],"events":["266429","266430"]
                                                                                            },
                                                                                            headers: {
                                                                                                'Host': 'www.aisleplanner.com',
                                                                                                'Connection': 'keep-alive',
                                                                                                'Origin': 'https://www.aisleplanner.com',
                                                                                                'X-XSRF-TOKEN': token,
                                                                                                //'X-AP-API-Version': todayDate,
                                                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                'Content-Type': 'application/json;charset=UTF-8',
                                                                                                'Accept': 'application/json, text/plain, */*',
                                                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                            },
                                                                                            jar: cookiejar,
                                                                                            json: true // Automatically stringifies the body to JSON
                                                                                        };

                                                                                        rp(addGuest2Options)
                                                                                            .then(function (addGuest2Body) {
                                                                                                console.log("guest %j %j was added successfully!", guest2FirstName, guest2LastName);
                                                                                                //console.log("addGuest2Body: %j", addGuest2Body);
                                                                                                var guest2Id = addGuest2Body.guests[0].id;
                                                                                                //console.log("%j %j has user id: %j", guest2FirstName, guest2LastName, guest2Id);
                                                                                                // set attending rsvp status for bongsky
                                                                                                //console.log("setting rsvp status %s %s is: %j", guest2FirstName, guest2LastName, attending);
                                                                                                //var aisleplannerPrimaryAttending = (attending == "1") ? "attending" : "declined";
                                                                                                var updateGuest2AttendingOptions = {
                                                                                                    method: 'PUT',
                                                                                                    uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266429/guests/' + guest2Id,
                                                                                                    body: {
                                                                                                        wedding_guest_id: guest2Id,
                                                                                                        guest_list: 1,
                                                                                                        responded_on: null,
                                                                                                        meal_option_id: null,
                                                                                                        meal_declined: false,
                                                                                                        invitation_sent_on: null,
                                                                                                        notes: "",
                                                                                                        requires_transportation: false,
                                                                                                        wedding_event_id: "266429",
                                                                                                        attending_status: aisleplannerPrimaryAttending,
                                                                                                        _effective_meal_option_id: null
                                                                                                    },
                                                                                                    headers: {
                                                                                                        'Host': 'www.aisleplanner.com',
                                                                                                        'Connection': 'keep-alive',
                                                                                                        'Origin': 'https://www.aisleplanner.com',
                                                                                                        'X-XSRF-TOKEN': token,
                                                                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                        'Content-Type': 'application/json;charset=UTF-8',
                                                                                                        'Accept': 'application/json, text/plain, */*',
                                                                                                        'X-Requested-With': 'XMLHttpRequest',
                                                                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                    },
                                                                                                    jar: cookiejar,
                                                                                                    json: true // Automatically stringifies the body to JSON
                                                                                                };

                                                                                                rp(updateGuest2AttendingOptions)
                                                                                                    .then(function (updateGuest2AttendingBody) {
                                                                                                        console.log("guest %j %j rsvp status was added successfully!", guest2FirstName, guest2LastName);
                                                                                                        //console.log("updateGuest2AttendingBody: %j", updateGuest2AttendingBody);
                                                                                                        // set attending status for Claudia Cole
                                                                                                        //console.log("repeat setting rsvp status %j %j is: %j", guest2FirstName, guest2LastName, attending);
                                                                                                        var updateGuest2AttendingRepeatOptions = {
                                                                                                            method: 'PUT',
                                                                                                            uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266430/guests/' + guest2Id,
                                                                                                            body: {
                                                                                                                wedding_guest_id: guest2Id,
                                                                                                                guest_list: 1,
                                                                                                                responded_on: null,
                                                                                                                meal_option_id: null,
                                                                                                                meal_declined: false,
                                                                                                                invitation_sent_on: null,
                                                                                                                notes: "",
                                                                                                                requires_transportation: false,
                                                                                                                wedding_event_id: "266430",
                                                                                                                attending_status: aisleplannerPrimaryAttending,
                                                                                                                _effective_meal_option_id: null
                                                                                                            },
                                                                                                            headers: {
                                                                                                                'Host': 'www.aisleplanner.com',
                                                                                                                'Connection': 'keep-alive',
                                                                                                                'Origin': 'https://www.aisleplanner.com',
                                                                                                                'X-XSRF-TOKEN': token,
                                                                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                'Accept': 'application/json, text/plain, */*',
                                                                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                            },
                                                                                                            jar: cookiejar,
                                                                                                            json: true // Automatically stringifies the body to JSON
                                                                                                        };

                                                                                                        rp(updateGuest2AttendingRepeatOptions)
                                                                                                            .then(function (updateGuest2AttendingRepeatBody) {
                                                                                                                console.log("guest %j %j rsvp status was added successfully again!", guest2FirstName, guest2LastName);
                                                                                                                //console.log("updateGuest2AttendingRepeatBody: %j", updateGuest2AttendingRepeatBody);
                                                                                                                //console.log("GREAT SUCCESS!");
                                                                                                                if(numGuests <= 2) {
                                                                                                                    //console.log("no additional guests, signing out...");
                                                                                                                    //signout
                                                                                                                    console.log("signing out...");
                                                                    
                                                                                                                    var signoutOptions = {
                                                                                                                        uri: 'https://www.aisleplanner.com/signout',
                                                                                                                        headers: {
                                                                                                                            'Host': 'www.aisleplanner.com',
                                                                                                                            'Connection': 'keep-alive',
                                                                                                                            'Upgrade-Insecure-Requests': '1',
                                                                                                                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                                                                            'X-XSRF-TOKEN': token,
                                                                                                                            'X-Requested-With': 'XMLHttpRequest',
                                                                                                                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                            'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                            'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                            'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                        },
                                                                                                                        jar: cookiejar,
                                                                                                                        json: true // Automatically stringifies the body to JSON
                                                                                                                    };

                                                                                                                    rp(signoutOptions)
                                                                                                                        .then(function (signoutBody) {
                                                                                                                            console.log("signout succeeded!");
                                                                                                                            //END
                                                                                                                        })
                                                                                                                        .catch(function (signoutErr) {
                                                                                                                            console.log("signout failed! error: %j", signoutErr);
                                                                                                                        });
                                                                                                                } else {
                                                                                                                    console.log("adding guest first name: %j last name: %j", guest3FirstName, guest3LastName);
                                                                                                                    //add guest
                                                                                                                    var addGuest3Options = {
                                                                                                                        method: 'POST',
                                                                                                                        uri: 'https://www.aisleplanner.com/api/wedding/60620/guest_groups?guests=true',
                                                                                                                        body: {
                                                                                                                            group: {},
                                                                                                                            guests: [{"first_name":guest3FirstName,"last_name":guest3LastName,"is_primary_guest":true,"group_order":0}],"events":["266429","266430"]
                                                                                                                        },
                                                                                                                        headers: {
                                                                                                                            'Host': 'www.aisleplanner.com',
                                                                                                                            'Connection': 'keep-alive',
                                                                                                                            'Origin': 'https://www.aisleplanner.com',
                                                                                                                            'X-XSRF-TOKEN': token,
                                                                                                                            //'X-AP-API-Version': todayDate,
                                                                                                                            'X-Requested-With': 'XMLHttpRequest',
                                                                                                                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                            'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                            'Accept': 'application/json, text/plain, */*',
                                                                                                                            'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                            'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                            'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                        },
                                                                                                                        jar: cookiejar,
                                                                                                                        json: true // Automatically stringifies the body to JSON
                                                                                                                    };

                                                                                                                    rp(addGuest3Options)
                                                                                                                        .then(function (addGuest3Body) {
                                                                                                                            console.log("guest %j %j was added successfully!", guest3FirstName, guest3LastName);
                                                                                                                            //console.log("addGuest3Body: %j", addGuest3Body);
                                                                                                                            var guest3Id = addGuest3Body.guests[0].id;
                                                                                                                            //console.log("%j %j has user id: %j", guest3FirstName, guest3LastName, guest3Id);
                                                                                                                            // set attending rsvp status for bongsky
                                                                                                                            //console.log("setting rsvp status %s %s is: %j", guest3FirstName, guest3LastName, attending);
                                                                                                                            //var aisleplannerPrimaryAttending = (attending == "1") ? "attending" : "declined";
                                                                                                                            var updateGuest3AttendingOptions = {
                                                                                                                                method: 'PUT',
                                                                                                                                uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266429/guests/' + guest3Id,
                                                                                                                                body: {
                                                                                                                                    wedding_guest_id: guest3Id,
                                                                                                                                    guest_list: 1,
                                                                                                                                    responded_on: null,
                                                                                                                                    meal_option_id: null,
                                                                                                                                    meal_declined: false,
                                                                                                                                    invitation_sent_on: null,
                                                                                                                                    notes: "",
                                                                                                                                    requires_transportation: false,
                                                                                                                                    wedding_event_id: "266429",
                                                                                                                                    attending_status: aisleplannerPrimaryAttending,
                                                                                                                                    _effective_meal_option_id: null
                                                                                                                                },
                                                                                                                                headers: {
                                                                                                                                    'Host': 'www.aisleplanner.com',
                                                                                                                                    'Connection': 'keep-alive',
                                                                                                                                    'Origin': 'https://www.aisleplanner.com',
                                                                                                                                    'X-XSRF-TOKEN': token,
                                                                                                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                    'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                                    'Accept': 'application/json, text/plain, */*',
                                                                                                                                    'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                    'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                    'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                    'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                },
                                                                                                                                jar: cookiejar,
                                                                                                                                json: true // Automatically stringifies the body to JSON
                                                                                                                            };

                                                                                                                            rp(updateGuest3AttendingOptions)
                                                                                                                                .then(function (updateGuest3AttendingBody) {
                                                                                                                                    console.log("guest %j %j rsvp status was added successfully!", guest3FirstName, guest3LastName);
                                                                                                                                    //console.log("updateGuest3AttendingBody: %j", updateGuest3AttendingBody);
                                                                                                                                    // set attending status for Claudia Cole
                                                                                                                                    //console.log("repeat setting rsvp status %j %j is: %j", guest3FirstName, guest3LastName, attending);
                                                                                                                                    var updateGuest3AttendingRepeatOptions = {
                                                                                                                                        method: 'PUT',
                                                                                                                                        uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266430/guests/' + guest3Id,
                                                                                                                                        body: {
                                                                                                                                            wedding_guest_id: guest3Id,
                                                                                                                                            guest_list: 1,
                                                                                                                                            responded_on: null,
                                                                                                                                            meal_option_id: null,
                                                                                                                                            meal_declined: false,
                                                                                                                                            invitation_sent_on: null,
                                                                                                                                            notes: "",
                                                                                                                                            requires_transportation: false,
                                                                                                                                            wedding_event_id: "266430",
                                                                                                                                            attending_status: aisleplannerPrimaryAttending,
                                                                                                                                            _effective_meal_option_id: null
                                                                                                                                        },
                                                                                                                                        headers: {
                                                                                                                                            'Host': 'www.aisleplanner.com',
                                                                                                                                            'Connection': 'keep-alive',
                                                                                                                                            'Origin': 'https://www.aisleplanner.com',
                                                                                                                                            'X-XSRF-TOKEN': token,
                                                                                                                                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                            'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                                            'Accept': 'application/json, text/plain, */*',
                                                                                                                                            'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                            'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                            'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                            'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                        },
                                                                                                                                        jar: cookiejar,
                                                                                                                                        json: true // Automatically stringifies the body to JSON
                                                                                                                                    };

                                                                                                                                    rp(updateGuest3AttendingRepeatOptions)
                                                                                                                                        .then(function (updateGuest3AttendingRepeatBody) {
                                                                                                                                            console.log("guest %j %j rsvp status was added successfully again!", guest3FirstName, guest3LastName);
                                                                                                                                            //console.log("updateGuest3AttendingRepeatBody: %j", updateGuest3AttendingRepeatBody);
                                                                                                                                            //console.log("GREAT SUCCESS!");
                                                                                                                                            if(numGuests <= 3) {
                                                                                                                                                //console.log("no additional guests, signing out...");
                                                                                                                                                //signout
                                                                                                                                                console.log("signing out...");
                                                                                                
                                                                                                                                                var signoutOptions = {
                                                                                                                                                    uri: 'https://www.aisleplanner.com/signout',
                                                                                                                                                    headers: {
                                                                                                                                                        'Host': 'www.aisleplanner.com',
                                                                                                                                                        'Connection': 'keep-alive',
                                                                                                                                                        'Upgrade-Insecure-Requests': '1',
                                                                                                                                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                                                                                                        'X-XSRF-TOKEN': token,
                                                                                                                                                        'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                                    },
                                                                                                                                                    jar: cookiejar,
                                                                                                                                                    json: true // Automatically stringifies the body to JSON
                                                                                                                                                };

                                                                                                                                                rp(signoutOptions)
                                                                                                                                                    .then(function (signoutBody) {
                                                                                                                                                        console.log("signout succeeded!");
                                                                                                                                                        //END
                                                                                                                                                    })
                                                                                                                                                    .catch(function (signoutErr) {
                                                                                                                                                        console.log("signout failed! error: %j", signoutErr);
                                                                                                                                                    });
                                                                                                                                            } else {
                                                                                                                                                console.log("adding guest first name: %j last name: %j", guest4FirstName, guest4LastName);
                                                                                                                                                //add guest
                                                                                                                                                var addGuest4Options = {
                                                                                                                                                    method: 'POST',
                                                                                                                                                    uri: 'https://www.aisleplanner.com/api/wedding/60620/guest_groups?guests=true',
                                                                                                                                                    body: {
                                                                                                                                                        group: {},
                                                                                                                                                        guests: [{"first_name":guest4FirstName,"last_name":guest4LastName,"is_primary_guest":true,"group_order":0}],"events":["266429","266430"]
                                                                                                                                                    },
                                                                                                                                                    headers: {
                                                                                                                                                        'Host': 'www.aisleplanner.com',
                                                                                                                                                        'Connection': 'keep-alive',
                                                                                                                                                        'Origin': 'https://www.aisleplanner.com',
                                                                                                                                                        'X-XSRF-TOKEN': token,
                                                                                                                                                        //'X-AP-API-Version': todayDate,
                                                                                                                                                        'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                                        'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                                                        'Accept': 'application/json, text/plain, */*',
                                                                                                                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                                    },
                                                                                                                                                    jar: cookiejar,
                                                                                                                                                    json: true // Automatically stringifies the body to JSON
                                                                                                                                                };

                                                                                                                                                rp(addGuest4Options)
                                                                                                                                                    .then(function (addGuest4Body) {
                                                                                                                                                        console.log("guest %j %j was added successfully!", guest4FirstName, guest4LastName);
                                                                                                                                                        //console.log("addGuest4Body: %j", addGuest4Body);
                                                                                                                                                        var guest4Id = addGuest4Body.guests[0].id;
                                                                                                                                                        //console.log("%j %j has user id: %j", guest4FirstName, guest4LastName, guest4Id);
                                                                                                                                                        // set attending rsvp status for bongsky
                                                                                                                                                        //console.log("setting rsvp status %s %s is: %j", guest4FirstName, guest4LastName, attending);
                                                                                                                                                        //var aisleplannerPrimaryAttending = (attending == "1") ? "attending" : "declined";
                                                                                                                                                        var updateGuest4AttendingOptions = {
                                                                                                                                                            method: 'PUT',
                                                                                                                                                            uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266429/guests/' + guest4Id,
                                                                                                                                                            body: {
                                                                                                                                                                wedding_guest_id: guest4Id,
                                                                                                                                                                guest_list: 1,
                                                                                                                                                                responded_on: null,
                                                                                                                                                                meal_option_id: null,
                                                                                                                                                                meal_declined: false,
                                                                                                                                                                invitation_sent_on: null,
                                                                                                                                                                notes: "",
                                                                                                                                                                requires_transportation: false,
                                                                                                                                                                wedding_event_id: "266429",
                                                                                                                                                                attending_status: aisleplannerPrimaryAttending,
                                                                                                                                                                _effective_meal_option_id: null
                                                                                                                                                            },
                                                                                                                                                            headers: {
                                                                                                                                                                'Host': 'www.aisleplanner.com',
                                                                                                                                                                'Connection': 'keep-alive',
                                                                                                                                                                'Origin': 'https://www.aisleplanner.com',
                                                                                                                                                                'X-XSRF-TOKEN': token,
                                                                                                                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                                                'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                                                                'Accept': 'application/json, text/plain, */*',
                                                                                                                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                                            },
                                                                                                                                                            jar: cookiejar,
                                                                                                                                                            json: true // Automatically stringifies the body to JSON
                                                                                                                                                        };

                                                                                                                                                        rp(updateGuest4AttendingOptions)
                                                                                                                                                            .then(function (updateGuest4AttendingBody) {
                                                                                                                                                                console.log("guest %j %j rsvp status was added successfully!", guest4FirstName, guest4LastName);
                                                                                                                                                                //console.log("updateGuest4AttendingBody: %j", updateGuest4AttendingBody);
                                                                                                                                                                // set attending status for Claudia Cole
                                                                                                                                                                //console.log("repeat setting rsvp status %j %j is: %j", guest4FirstName, guest4LastName, attending);
                                                                                                                                                                var updateGuest4AttendingRepeatOptions = {
                                                                                                                                                                    method: 'PUT',
                                                                                                                                                                    uri: 'https://www.aisleplanner.com/api/wedding/60620/events/266430/guests/' + guest4Id,
                                                                                                                                                                    body: {
                                                                                                                                                                        wedding_guest_id: guest4Id,
                                                                                                                                                                        guest_list: 1,
                                                                                                                                                                        responded_on: null,
                                                                                                                                                                        meal_option_id: null,
                                                                                                                                                                        meal_declined: false,
                                                                                                                                                                        invitation_sent_on: null,
                                                                                                                                                                        notes: "",
                                                                                                                                                                        requires_transportation: false,
                                                                                                                                                                        wedding_event_id: "266430",
                                                                                                                                                                        attending_status: aisleplannerPrimaryAttending,
                                                                                                                                                                        _effective_meal_option_id: null
                                                                                                                                                                    },
                                                                                                                                                                    headers: {
                                                                                                                                                                        'Host': 'www.aisleplanner.com',
                                                                                                                                                                        'Connection': 'keep-alive',
                                                                                                                                                                        'Origin': 'https://www.aisleplanner.com',
                                                                                                                                                                        'X-XSRF-TOKEN': token,
                                                                                                                                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                                                        'Content-Type': 'application/json;charset=UTF-8',
                                                                                                                                                                        'Accept': 'application/json, text/plain, */*',
                                                                                                                                                                        'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                                                    },
                                                                                                                                                                    jar: cookiejar,
                                                                                                                                                                    json: true // Automatically stringifies the body to JSON
                                                                                                                                                                };

                                                                                                                                                                rp(updateGuest4AttendingRepeatOptions)
                                                                                                                                                                    .then(function (updateGuest4AttendingRepeatBody) {
                                                                                                                                                                        console.log("guest %j %j rsvp status was added successfully again!", guest4FirstName, guest4LastName);
                                                                                                                                                                        //console.log("updateGuest4AttendingRepeatBody: %j", updateGuest4AttendingRepeatBody);
                                                                                                                                                                        //console.log("GREAT SUCCESS!");
                                                                                                                                                                        
                                                                                                                                                                        //console.log("not supporting additional guests, signing out...");
                                                                                                                                                                        //signout
                                                                                                                                                                        console.log("signing out...");
                                                                                                                        
                                                                                                                                                                        var signoutOptions = {
                                                                                                                                                                            uri: 'https://www.aisleplanner.com/signout',
                                                                                                                                                                            headers: {
                                                                                                                                                                                'Host': 'www.aisleplanner.com',
                                                                                                                                                                                'Connection': 'keep-alive',
                                                                                                                                                                                'Upgrade-Insecure-Requests': '1',
                                                                                                                                                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                                                                                                                                'X-XSRF-TOKEN': token,
                                                                                                                                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                                                                                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                                                                                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                                                                                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                                                                                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                                                                                                                                            },
                                                                                                                                                                            jar: cookiejar,
                                                                                                                                                                            json: true // Automatically stringifies the body to JSON
                                                                                                                                                                        };

                                                                                                                                                                        rp(signoutOptions)
                                                                                                                                                                            .then(function (signoutBody) {
                                                                                                                                                                                console.log("signout succeeded!");
                                                                                                                                                                                //END
                                                                                                                                                                            })
                                                                                                                                                                            .catch(function (signoutErr) {
                                                                                                                                                                                console.log("signout failed! error: %j", signoutErr);
                                                                                                                                                                            });
                                                                                                                                                                    });//updateGuest4AttendingRepeatOptions.then
                                                                                                                                                            });
                                                                                                                                                    }); 
                                                                                                                                            }         
                                                                                                                                        });
                                                                                                                                });
                                                                                                                        });
                                                                                                                }
                                                                                                            });
                                                                                                    });
                                                                                            });    
                                                                                    }
                                                                                });
                                                                        });
                                                                });
                                                        }
                                                                                
                                                    //don't care if guest fails since primary already passed
                                                    })
                                                    .catch(function (updatePrimaryAttendingRepeatErr) {
                                                        console.log("updatePrimaryAttendingRepeatErr: %j", updatePrimaryAttendingRepeatErr);
                                                        //signout
                                                        console.log("signing out...");
                                
                                                        var signoutOptions = {
                                                            uri: 'https://www.aisleplanner.com/signout',
                                                            headers: {
                                                                'Host': 'www.aisleplanner.com',
                                                                'Connection': 'keep-alive',
                                                                'Upgrade-Insecure-Requests': '1',
                                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                                'X-XSRF-TOKEN': token,
                                                                'X-Requested-With': 'XMLHttpRequest',
                                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                                'Accept-Encoding': 'gzip, deflate, br',
                                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                            },
                                                            jar: cookiejar,
                                                            json: true // Automatically stringifies the body to JSON
                                                        };

                                                        rp(signoutOptions)
                                                            .then(function (signoutBody) {
                                                                console.log("signout succeeded!");
                                                            })
                                                            .catch(function (signoutErr) {
                                                                console.log("signout failed! error: %j", signoutErr);
                                                            });//signout
                                                    });//updatePrimaryAttendingRepeat
                                            })
                                            .catch(function (updatePrimaryAttendingErr) {
                                                console.log("updatePrimaryAttendingErr: %j", updatePrimaryAttendingErr);
                                                //signout
                                                console.log("signing out...");
                                
                                                var signoutOptions = {
                                                    uri: 'https://www.aisleplanner.com/signout',
                                                    headers: {
                                                        'Host': 'www.aisleplanner.com',
                                                        'Connection': 'keep-alive',
                                                        'Upgrade-Insecure-Requests': '1',
                                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                        'X-XSRF-TOKEN': token,
                                                        'X-Requested-With': 'XMLHttpRequest',
                                                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                        'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                        'Accept-Encoding': 'gzip, deflate, br',
                                                        'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                                    },
                                                    jar: cookiejar,
                                                    json: true // Automatically stringifies the body to JSON
                                                };

                                                rp(signoutOptions)
                                                    .then(function (signoutBody) {
                                                        console.log("signout succeeded!");
                                                    })
                                                    .catch(function (signoutErr) {
                                                        console.log("signout failed! error: %j", signoutErr);
                                                    });//signout
                                            });//updatePrimaryAttending
                                    })
                                    .catch(function (addPrimaryErr) {
                                        console.log("add primary guest failed... error: %j", addPrimaryErr);
                                        //signout
                                        console.log("signing out...");
                                
                                        var signoutOptions = {
                                            uri: 'https://www.aisleplanner.com/signout',
                                            headers: {
                                                'Host': 'www.aisleplanner.com',
                                                'Connection': 'keep-alive',
                                                'Upgrade-Insecure-Requests': '1',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                                'X-XSRF-TOKEN': token,
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
                                                'Referer': 'https://www.aisleplanner.com/app/project/60620/tools/guests/event/266429',
                                                'Accept-Encoding': 'gzip, deflate, br',
                                                'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                                            },
                                            jar: cookiejar,
                                            json: true // Automatically stringifies the body to JSON
                                        };

                                        rp(signoutOptions)
                                            .then(function (signoutBody) {
                                                console.log("signout succeeded!");
                                            })
                                            .catch(function (signoutErr) {
                                                console.log("signout failed! error: %j", signoutErr);
                                            });//signout
                                    });
                            })
                            .catch(function (signinErr) {
                                // signin failed...
                                console.log("signin failed with signinErr: %j", signinErr);
                            });//signin
                    })
                    .catch(function (err) {
                        // API call failed...
                        console.log("error: %j", err);
                    });//original get request
                break;
            case "MODIFY":
                // Updating an existing Name with other values
                // Only interested in "attending" changing or "guests" changing
                console.log("MODIFY EXISTING AISLEPLANNER");
                /*
                if (typeof fullName !== 'undefined') {
                    console.log("new fullName: %j, firstName: %j, lastName: %j", fullName, firstName, lastName);
                }
                if (typeof guest1FullName !== 'undefined') {
                    console.log("new guest1FullName: %j, guest1FirstName: %j, guest1LastName: %j", guest1FullName, guest1FirstName, guest1LastName);
                }
                if (typeof guest2FullName !== 'undefined') {
                    console.log("new guest2FullName: %j, guest2FirstName: %j, guest2LastName: %j", guest2FullName, guest2FirstName, guest2LastName);
                }
                if (typeof guest3FullName !== 'undefined') {
                    console.log("new guest3FullName: %j, guest3FirstName: %j, guest3LastName: %j", guest3FullName, guest3FirstName, guest3LastName);
                }
                if (typeof guest4FullName !== 'undefined') {
                    console.log("new guest4FullName: %j, guest4FirstName: %j, guest4LastName: %j", guest4FullName, guest4FirstName, guest4LastName);
                }
                
                if (typeof oldFullName !== 'undefined') {
                    console.log("old fullName: %j, firstName: %j, lastName: %j", oldFullName, oldFirstName, oldLastName);
                }
                if (typeof oldGuest1FullName !== 'undefined') {
                    console.log("old guest1FullName: %j, guest1FirstName: %j, guest1LastName: %j", oldGuest1FullName, oldGuest1FirstName, oldGuest1LastName);
                }
                if (typeof oldGuest2FullName !== 'undefined') {
                    console.log("old guest2FullName: %j, guest2FirstName: %j, guest2LastName: %j", oldGuest2FullName, oldGuest2FirstName, oldGuest2LastName);
                }
                if (typeof oldGuest3FullName !== 'undefined') {
                    console.log("old guest3FullName: %j, guest3FirstName: %j, guest3LastName: %j", oldGuest3FullName, oldGuest3FirstName, oldGuest3LastName);
                }
                if (typeof oldGuest4FullName !== 'undefined') {
                    console.log("old guest4FullName: %j, guest4FirstName: %j, guest4LastName: %j", oldGuest4FullName, oldGuest4FirstName, oldGuest4LastName);
                }
                
                if(attending != oldAttending){
                    //Update aisle planner with new attending status
                    console.log("ATTENDING IS DIFFERENT WRITE TO AISLEPLANNER");
                    //need to go through all user + guests and update aisle planner
                }
                */
                break;
            case "REMOVE":
                // Removing an existing Name
                // Do nothing, can modify this later if we want
                // Dynamo Delete to do something in Aisle Planner
                console.log("REMOVE EXISTING AISLEPLANNER");
                console.log("DOING NOTHING, REMOVE UNSUPPORTED");
                break;
            default:
                // Should never get here
                console.log("DEFAULT UNHANDLED CASE");
        }//case
        
    });//foreach Record
    callback(null, `Successfully processed ${event.Records.length} records.`);
};//exports handler
