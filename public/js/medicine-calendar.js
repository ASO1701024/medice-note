$('#medicine-calendar').fullCalendar({
    height: window.innerHeight - 70,
    locale: 'ja',
    header: {
        left: 'prev,today,next',
        center: 'title',
        right: ''
    },
    events: '/api/calendar',
    eventColor: '#4285F4',
    eventTextColor: '#fff',
});