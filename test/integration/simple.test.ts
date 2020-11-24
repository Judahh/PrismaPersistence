// file deepcode ignore no-any: any needed
import {
  Handler,
  PersistenceInfo,
  Operation,
  Event,
  MongoDB,
} from 'flexiblepersistence';
import { PostgresDB } from '../../source/postgres/postgresDB';
import Utils from '../../source/utils';
import { Journaly, SubjectObserver } from 'journaly';
import { eventInfo, readInfo } from './databaseInfos';

let read;
let write;
test('add and read array and find object', async (done) => {
  const journaly = Journaly.newJournaly() as SubjectObserver<any>;
  read = new PostgresDB(new PersistenceInfo(readInfo, journaly));
  write = new MongoDB(new PersistenceInfo(eventInfo, journaly));

  await Utils.init(read.getPool());

  const handler = new Handler(write, read);
  await handler.getWrite().clear('events');

  const obj = {};
  obj['string'] = 'test';
  try {
    // console.log('0');
    const persistencePromise = await handler.addEvent(
      new Event({
        operation: Operation.create,
        name: 'Object',
        content: obj,
      })
    );

    // console.log('1:', persistencePromise.receivedItem);

    expect(persistencePromise.receivedItem).toStrictEqual({
      _id: persistencePromise.receivedItem._id,
      string: 'test',
      number: null,
    });

    const persistencePromise1 = await handler.readArray('Object', {});
    // console.log('2:', persistencePromise1.receivedItem);
    // console.log('2:', persistencePromise1.receivedItem._id);
    expect(persistencePromise1.receivedItem).toStrictEqual([
      {
        _id: persistencePromise1.receivedItem[0]._id,
        string: 'test',
        number: null,
      },
    ]);
    expect(persistencePromise1.selectedItem).toStrictEqual({});
    expect(persistencePromise1.sentItem).toStrictEqual(undefined);

    const persistencePromise2 = await handler.readItem('Object', {});
    // console.log('3:', persistencePromise2.receivedItem);

    expect(persistencePromise2.receivedItem).toStrictEqual({
      _id: persistencePromise2.receivedItem._id,
      string: 'test',
      number: null,
    });
    expect(persistencePromise2.selectedItem).toStrictEqual({});
    expect(persistencePromise2.sentItem).toStrictEqual(undefined);

    const persistencePromise3 = await handler.addEvent(
      new Event({
        operation: Operation.update,
        name: 'Object',
        selection: { string: 'test' },
        content: { string: 'bob' },
      })
    );
    // console.log('4:', persistencePromise3.receivedItem);
    // console.log(persistencePromise3);
    expect(persistencePromise3.result.rowCount).toBe(1);
    expect(persistencePromise3.receivedItem).toStrictEqual({
      _id: persistencePromise3.receivedItem._id,
      string: 'bob',
      number: null,
    });
    expect(persistencePromise3.selectedItem).toStrictEqual({
      string: 'test',
    });
    expect(persistencePromise3.sentItem).toStrictEqual({
      string: 'bob',
    });
    // console.log('fuc');
    // console.log(await read.query('UPDATE object SET test = \'bob\', number: = \'10\' WHERE (test = \'test\')', [], {}));

    const persistencePromise4 = await handler.addEvent(
      new Event({
        operation: Operation.delete,
        name: 'Object',
        selection: { string: 'bob' },
      })
    );

    expect(persistencePromise4.receivedItem).toStrictEqual(undefined);
    expect(persistencePromise4.selectedItem).toStrictEqual({ string: 'bob' });
    expect(persistencePromise4.sentItem).toStrictEqual(undefined);

    // console.log('fuc1');

    const persistencePromise5 = await handler.readArray('Object', {});

    expect(persistencePromise5.receivedItem.length).toBe(0);
    expect(persistencePromise5.result.rowCount).toBe(0);
    expect(persistencePromise5.receivedItem).toStrictEqual([]);
    expect(persistencePromise5.selectedItem).toStrictEqual({});
    expect(persistencePromise5.sentItem).toStrictEqual(undefined);

    const persistencePromise6 = await handler.addEvent(
      new Event({
        operation: Operation.delete,
        name: 'Object',
        single: false,
      })
    );

    // console.log('fuc2:', persistencePromise6);
    expect(persistencePromise6.receivedItem).toStrictEqual([]);
    expect(persistencePromise6.selectedItem).toStrictEqual(undefined);
    expect(persistencePromise6.sentItem).toStrictEqual(undefined);
    // console.log('fuc3');
  } catch (error) {
    await handler.addEvent(
      new Event({
        operation: Operation.delete,
        name: 'Object',
        single: false,
      })
    );
    const persistencePromise7 = await handler.readArray('Object', {});
    expect(persistencePromise7.result.rowCount).toBe(0);
    await handler.getWrite().clear('events');
    await Utils.end(read.getPool());
    await write.close();
    console.error(error);
    expect(error).toBe(null);
    done();
  }
  await handler.addEvent(
    new Event({
      operation: Operation.delete,
      name: 'Object',
      single: false,
    })
  );
  const persistencePromise7 = await handler.readArray('Object', {});
  expect(persistencePromise7.result.rowCount).toBe(0);
  await handler.getWrite().clear('events');
  await Utils.end(read.getPool());
  await write.close();
  done();
});

//! TODO: Improve complex Object management
// test('add complex object and read array and find object', async done => {
//   const info = new PersistenceInfo({---
//     database: 'postgres',
//     host: process.env.POSTGRES_HOST || 'localhost',
//     port: process.env.POSTGRES_PORT || 5432,
//     username: process.env.POSTGRES_USER || 'postgres',
//     password: process.env.POSTGRES_PASSWORD || 'evox2019',
//   });

//   read = new PostgresDB(info);
//   write = new MongoDB(
//     new PersistenceInfo({---
//       database: 'write',
//       host: process.env.MONGO_HOST || 'localhost',
//       port: process.env.MONGO_PORT,
//     })
//   );
//   const handler = new Handler(write, read);
//   await handler.getWrite().clear('events');
//   await Utils.init(read.getPool());
//   const obj = { string: 'test', test2: { string: 'test' } };
//   try {
//     const persistencePromise = await handler.addEvent(
//       new Event({ operation: Operation.create, name: 'Object2', content: obj })
//     );

//     // console.log(persistencePromise.receivedItem.test2);

//     expect(persistencePromise.receivedItem).toStrictEqual({
//       _id: persistencePromise.receivedItem._id,
//       string: 'test',
//       test2: { string: 'test' },
//       number: null,
//     });

//     const persistencePromise1 = await handler.readArray('Object', {});
//     expect(persistencePromise1.receivedItem).toStrictEqual([
//       {
//         _id: persistencePromise1.receivedItem._id,
//         string: 'test',
//         number: null,
//       },
//     ]);
//     expect(persistencePromise1.selectedItem).toStrictEqual({});
//     expect(persistencePromise1.sentItem).toStrictEqual(undefined);

//     const persistencePromise2 = await handler.readItem('Object', {});

//     expect(persistencePromise2.receivedItem).toStrictEqual({
//       _id: persistencePromise2.receivedItem._id,
//       string: 'test',
//       number: null,
//     });
//     expect(persistencePromise2.selectedItem).toStrictEqual({});
//     expect(persistencePromise2.sentItem).toStrictEqual(undefined);

//     const persistencePromise3 = await handler.addEvent(
//       new Event({
//         operation: Operation.update,
//         name: 'Object',
//         selection: { string: 'test' },
//         content: { string: 'bob' },
//       })
//     );
//     // console.log(persistencePromise3);
//     expect(persistencePromise3.result.rowCount).toBe(1);
//     expect(persistencePromise3.receivedItem).toStrictEqual({
//       _id: persistencePromise2.receivedItem._id,
//       string: 'bob',
//       number: null,
//     });
//     expect(persistencePromise3.selectedItem).toStrictEqual({
//       string: 'test',
//     });
//     expect(persistencePromise3.sentItem).toStrictEqual({
//       string: 'bob',
//     });
//     // console.log(await read.query('UPDATE object SET test = \'bob\', number: = \'10\' WHERE (test = \'test\')', [], {}));

//     const persistencePromise4 = await handler.addEvent(
//       new Event({
//         operation: Operation.delete,
//         name: 'Object',
//         selection: { string: 'bob' },
//       })
//     );

//     expect(persistencePromise4.receivedItem).toStrictEqual(undefined);
//     expect(persistencePromise4.selectedItem).toStrictEqual({ string: 'bob' });
//     expect(persistencePromise4.sentItem).toStrictEqual(undefined);

//     const persistencePromise5 = await handler.readArray('Object', {});

//     expect(persistencePromise5.receivedItem.length).toBe(0);
//     expect(persistencePromise5.result.rowCount).toBe(0);
//     expect(persistencePromise5.receivedItem).toStrictEqual([]);
//     expect(persistencePromise5.selectedItem).toStrictEqual({});
//     expect(persistencePromise5.sentItem).toStrictEqual(undefined);

//     const persistencePromise6 = await handler.addEvent(
//       new Event({ operation: Operation.delete, name: 'Object' })
//     );
//     expect(persistencePromise6.receivedItem).toStrictEqual([]);
//     expect(persistencePromise6.selectedItem).toStrictEqual(undefined);
//     expect(persistencePromise6.sentItem).toStrictEqual(undefined);
//   } catch (error) {
//     await handler.addEvent(
//       new Event({ operation: Operation.delete, name: 'Object' })
//     );
//     const persistencePromise7 = await handler.readArray('Object', {});
//     expect(persistencePromise7.result.rowCount).toBe(0);
//     await handler.getWrite().clear('events');
//     await Utils.dropTables(read.getPool());
//     await write.close();
//     console.error(error);
//     expect(error).toBe(null);
//     done();
//   }
//   await handler.addEvent(
//     new Event({ operation: Operation.delete, name: 'Object' })
//   );
//   await handler.getWrite().clear('events');
//   await Utils.dropTables(read.getPool());
//   await write.close();
//   done();
// });
