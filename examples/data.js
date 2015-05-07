var columns = [
    {title: "ID", key: "id"},
    {title: "Name", key: "first_name"},
    {title: "Email", key: "email"},
    {title: "Country", key: "country"},
    {title: "Expenses", key: "expenses"}
];

var data = [{
    "id": 1,
    "first_name": "Russell",
    "email": "rmills0@independent.co.uk",
    "country": "Croatia",
    "expenses": "$8.94"
}, {
    "id": 2,
    "first_name": "Laura",
    "email": "lwest1@com.com",
    "country": "China",
    "expenses": "$5.32"
}, {
    "id": 3,
    "first_name": "Carlos",
    "email": "cdean2@macromedia.com",
    "country": "China",
    "expenses": "$0.47"
}, {
    "id": 4,
    "first_name": "Nicholas",
    "email": "nhart3@huffingtonpost.com",
    "country": "Thailand",
    "expenses": "$4.20"
}, {
    "id": 5,
    "first_name": "Ernest",
    "email": "ecollins4@goodreads.com",
    "country": "China",
    "expenses": "$20.16"
}, {
    "id": 6,
    "first_name": "Heather",
    "email": "hweaver5@dot.gov",
    "country": "Dominican Republic",
    "expenses": "$4.55"
}, {
    "id": 7,
    "first_name": "Harold",
    "email": "hbutler6@discovery.com",
    "country": "Mali",
    "expenses": "$7.06"
}, {
    "id": 8,
    "first_name": "Mildred",
    "email": "moliver7@ed.gov",
    "country": "France",
    "expenses": "$2.27"
}, {
    "id": 9,
    "first_name": "Timothy",
    "email": "thowell8@nih.gov",
    "country": "Gambia",
    "expenses": "$12.18"
}, {
    "id": 10,
    "first_name": "Barbara",
    "email": "bfox9@free.fr",
    "country": "Indonesia",
    "expenses": "$6.62"
}];

moreData = [];

for (var i = 0; i < 9; i++) {
    moreData = moreData.concat(data);
}

var columnsLong = [
    {title: "ID", key: "id", width: 40},
    {title: "Name", key: "name"},
    {title: "Country", key: "country"},
    {title: "IP-address", key: "ip_address"},
    {title: "Email", key: "email"},
    {title: "Text", key: "text"},
    {title: "Text2", key: "text2"}
];
var dataLong = [
    {
        "name": "Nelson",
        "id": 2,
        "ip_address": "39.211.252.103",
        "country": "Kazakhstan",
        "email": "jjordan@agivu.com",
        "text": "This is a text about nothing in particular. It's interesting that it actually gets truncated.",
        "text2": "This is a text about nothing in particular"
    },
    {
        "id": 3,
        "name": "Garcia",
        "country": "Madagas",
        "ip_address": "",
        "email": "jdean@skinte.biz",
        "text": "This is a text talking about nothing in particular.",
        "text2": "This is a text"
    },
    {
        "id": 4,
        "name": "Richardson",
        "country": "Somalia",
        "ip_address": "27.214.238.100",
        "email": "nblack@midel.gov",
        "text": "This is a text about nothing in particular. It's interesting that it actually gets truncated.",
        "text2": "This is a text about nothing in particular"
    },
    {
        "id": 5,
        "name": "Kennedy",
        "country": "Libya",
        "ip_address": "82.148.96.120",
        "email": "charrison@tambee.name",
        "text": "Miusov, as a man man of breeding and deilcacy, could not but feel some inwrd qualms",
        "text2": "This is a text about nothing in particular"
    }
];

var longText = "Miusov, as a man man of breeding and deilcacy, could not but feel some inwrd qualms, when he reached " +
    "the Father Superior's with Ivan: he felt ashamed of havin lost his temper. He felt that he ought to have " +
    "disdaimed that despicable wretch, Fyodor Pavlovitch, too much to have been upset by him in Father Zossima's " +
    "cell, and so to have forgotten himself. \"Teh monks were not to blame, in any case,\" he reflceted, on the " +
    "steps. \"And if they're decent people here (and the Father Superior, I understand, is a nobleman) why not be " +
    "friendly and courteous withthem? I won't argue, I'll fall in with everything, I'll win them by politness, and " +
    "show them that I've nothing to do with that Aesop, thta buffoon, that Pierrot, and have merely been takken in " +
    "over this affair, just as they have.";