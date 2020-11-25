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
import { PrismaClient } from '@prisma/client';
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
    console.log(input);

    this.prisma[ //.objects
      // .create(
      (input.scheme + 's').toLowerCase()
    ]
      [method]({
        data:
          method.includes('delete') || method.includes('find')
            ? undefined
            : this.realInput(input),
        where: input.selectedItem,
      })
      .then((output) => {
        console.log(output);

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
      ? this.makePromise(input, 'createMany')
      : this.makePromise(input, 'create');
  }
  update(input: PersistenceInputUpdate): Promise<PersistencePromise> {
    return input.single
      ? this.makePromise(input, 'updateFirst')
      : this.makePromise(input, 'updateMany');
  }
  read(input: PersistenceInputRead): Promise<PersistencePromise> {
    // console.log('read', input);
    return input.single
      ? this.makePromise(input, 'findFirst')
      : this.makePromise(input, 'findMany');
  }
  delete(input: PersistenceInputDelete): Promise<PersistencePromise> {
    // console.log('FUCKING DELETE');

    return input.single
      ? this.makePromise(input, 'deleteFirst')
      : this.makePromise(input, 'deleteMany');
  }

  getPersistenceInfo(): PersistenceInfo {
    return this.persistenceInfo;
  }

  close(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.end(resolve);
    });
  }

  private end(resolve): void {
    this.prisma.end(() => {
      resolve(true);
    });
  }
}
