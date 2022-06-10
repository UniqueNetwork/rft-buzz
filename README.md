# RFT Campaign Backend and Scripts

## Running backend and TG bot

1. Copy .env file into the project root
2. Run

```
docker-compose up -d --build
```

## Running test frontend locally

1. Run
```
npm install
npm install -g webpack
npm install -g webpack-cli
npm run build
npm run host
```

2. Open https://localhost:3002

## Голосование

Демо-фронт доступен тут:
https://localhost:3002/vote.html

### Вызовы бэка:
#### GET /vote 
Возвращает JSON массив - список возможных опций для голосования. Это ID панков. Например:

```
[9774, 6148, 8220, 7043, 8722, 8877, 8885, 6238, 3178, 4967, 2616, 7695]
```

#### POST /vote
Принимает голос в виде JSON объекта, в котором есть поля:

address - голосующий адрес (из Polkadot{.js} расширения)
message - одна из опций сверху
signature - подпись опции адресом

```
{
    "address":"5EnzEXBuxFHdymceAAtstym8FETQqH4inx29XJSP6uHaCUiP", 
    "message":"9774", "signature":"0x84167251bf244832dcecde317a7c3078d623a42f866ab0e0256fa03a44a4fd70398a9b6aeb95708ba68db0a91a3cf241c8fbc5a61dd202a3965d2a33ee15348d"
}
```

### Порядок действий с примерами

1. Получить список опций и заполнить опции для голосования:
    https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L79

    Туда же входит получение картинок панков:
    https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L71

2. Подключить расширение Polkadot{.js}, прочитать список адресов, показать пользователю чтоб выбрал адрес:
    https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L66

3. Пользователь нажимает кнопку Vote, происходит следующее:

    3.1 Получаем параметры вызова, т.е. голосующий адрес (который пользователь выбрал раньше) и за что проголосовали 
        https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L19

    3.2 Соединяемся с блокчейн нодой и проверяем, что адрес имеет право голосовать (это предварительный фильтр валидности голосующих, окончательный будет при подсчете):
        https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L24

    3.3 Вычисляем подпись (вызывается Polkadot{.js} и просит пользователя ввести пароль, итп.)
        https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L29

    3.4 Посылаем подпись в бэк:
        https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L38

    3.5 Бэк получает подпись, проверяет опцию за которую голосовали, проверяет подпись, записывает все в базу. Если что, шлет обратно ошибку и вот тут мы ее показывам:
        https://github.com/UniqueNetwork/rft-buzz/blob/d0a3f03c714ba4cb2f8fbeafe2d5baba1f482229/dist/vote.html#L45


    