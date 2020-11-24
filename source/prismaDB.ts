/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PersistenceAdapter,
  PersistenceInfo,
  PersistencePromise,
  // RelationValueDAODB,
  // SelectedItemValue,
  PersistenceInputCreate,
  PersistenceInputUpdate,
  PersistenceInputRead,
  PersistenceInputDelete,
} from 'flexiblepersistence';
import { PrismaClient } from "@prisma/client"
export class PrismaDB implements PersistenceAdapter {
  private persistenceInfo: PersistenceInfo;
  private prisma;

  constructor(persistenceInfo: PersistenceInfo) {
    this.persistenceInfo = persistenceInfo;
    this.prisma = new PrismaClient();
  }

  private aggregateFromReceivedArray(receivedItem, realInput) {
    return realInput.map((value, index) =>
      this.aggregateFromReceived(receivedItem[index], value)
    );
  }

  private aggregateFromReceived(receivedItem, value) {
    const id = this.getIdFromReceived(receivedItem);
    if (id)
      return {
        ...value,
        id: id,
      };
    return value;
  }

  private getIdFromReceived(receivedItem) {
    return receivedItem?.id?.toString() || receivedItem?._id?.toString();
  }

  private realInput(input) {
    let realInput = input.item ? input.item : {};
    if (Array.isArray(realInput))
      realInput = this.aggregateFromReceivedArray(
        input['receivedItem'],
        realInput
      );
    else
      realInput = this.aggregateFromReceived(input['receivedItem'], realInput);

    // console.log(realInput);
    return realInput;
  }

  private persistencePromise(input, method, resolve, reject) {
    // console.log(method);
    const input1 = !method.includes('create')
      ? method.includes('ById')
        ? input.id
        : input.selectedItem
      : this.realInput(input);
    const input2 = this.realInput(input);
    // console.log(input1);
    // console.log(input2);
    this.persistenceInfo.journaly
      .publish(input.scheme + 'DAO.' + method, input1, input2)
      .then((output) => {
        const persistencePromise: PersistencePromise = {
          receivedItem: output,
          result: output,
          selectedItem: input.selectedItem,
          sentItem: input.item, //| input.sentItem,
        };
        // console.log(persistencePromise);
        resolve(persistencePromise);
      })
      .catch((error) => {
        reject(error);
      });
  }

  private makePromise(input, method): Promise<PersistencePromise> {
    return new Promise((resolve, reject) => {
      this.persistencePromise(input, method, resolve, reject);
    });
  }

  correct(input: PersistenceInputUpdate): Promise<PersistencePromise> {
    //! Envia o input para o service determinado pelo esquema e lá ele faz as
    //! operações necessárias usando o journaly para acessar outros DAOs ou
    //! DAOs.
    //! Sempre deve-se receber informações do tipo input e o output deve ser
    //! compatível com o input para pemitir retro-alimentação.
    //! Atualizar o input para que utilize o melhor dos dois
    //! (input e parametros usados no SimpleAPI).
    return this.update(input);
  }

  nonexistent(input: PersistenceInputDelete): Promise<PersistencePromise> {
    return this.delete(input);
  }

  existent(input: PersistenceInputCreate): Promise<PersistencePromise> {
    return this.create(input);
  }

  create(input: PersistenceInputCreate): Promise<PersistencePromise> {
    // console.log('CREATE:', input);
    return Array.isArray(input.item)
      ? this.makePromise(input, 'createArray')
      : this.makePromise(input, 'create');
  }
  update(input: PersistenceInputUpdate): Promise<PersistencePromise> {
    return input.id
      ? this.makePromise(input, 'updateById')
      : input.single
      ? this.makePromise(input, 'update')
      : this.makePromise(input, 'updateArray');
  }
  read(input: PersistenceInputRead): Promise<PersistencePromise> {
    // console.log('read', input);
    return input.id
      ? this.makePromise(input, 'readById')
      : input.single
      ? this.makePromise(input, 'read')
      : this.makePromise(input, 'readArray');
  }
  delete(input: PersistenceInputDelete): Promise<PersistencePromise> {
    // console.log('FUCKING DELETE');

    return input.id
      ? this.makePromise(input, 'deleteById')
      : input.single
      ? this.makePromise(input, 'delete')
      : this.makePromise(input, 'deleteArray');
  }

  getPersistenceInfo(): PersistenceInfo {
    return this.persistenceInfo;
  }

  getPool(): Pool {
    // TODO: remove
    return this.pool;
  }

  close(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.end(resolve);
    });
  }

  private end(resolve): void {
    this.pool.end(() => {
      resolve(true);
    });
  }
}
