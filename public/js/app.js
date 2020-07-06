function convertTime(time) {
    let array = time.split(':');
    if (array[0] <= 9) {
        array[0] = `0${array[0]}`;
    }
    time = `${array[0]}:${array[1]}`;

    return time;
}