describe('IDBWrapper', function(){

  describe('basic CRUD, in-line keys', function(){

    var store;

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-simple'
      });
      return store.ready;
    });

    it('should store a well-formed object', function(){
      var data = {
        id: 1,
        name: 'John'
      };
      return store.put(data)
      .then(function(insertId){
        expect(insertId).to.equal(data.id);
      });
    });

    it('should fetch a stored object', function(){
      return store.get(1)
      .then(function(data){
        expect(data.name).to.equal('John');
      });
    });

    it('should overwrite a given object', function(){
      var data = {
        id: 1,
        name: 'James'
      };
      return store.put(data)
      .then(function(insertId){
        return store.get(1);
      })
      .then(function(data){
        expect(data.name).to.equal('James');
      });
    });

    it('should store an object w/o an id', function(){
      var data = {
        name: 'Joe'
      };
      return store.put(data)
      .then(function(insertId){
        expect(insertId).to.exist;
        return store.get(insertId);
      })
      .then(function(result){
        expect(result.name).to.equal(data.name);
      });
    });

    it('should get all stored objects', function(){
      return store.getAll()
      .then(function(data){
        expect(data.length).to.equal(2);
      });
    });

    it('should delete a given object', function(){
      return store.remove(1)
      .then(function(result){
        return store.get(1);
      })
      .then(function(data){
        expect(data).to.not.exist;
      });
    });

    it('should clear all objects', function(){
      return store.clear()
      .then(function(){
        return store.getAll();
      })
      .then(function(data){
        expect(data.length).to.equal(0);
      });
    });

    after(function(){
      return store.clear();
    });
  });

  describe('basic CRUD, out-of-line keys', function(){

    var store;

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-simple-out-of-line',
        keyPath: null
      });
      return store.ready;
    });

    it('should store a well-formed object', function(){
      var data = {
        name: 'John'
      };
      var id = 1;
      return store.put(id, data)
      .then(function(insertId){
        expect(insertId).to.equal(id);
      });
    });

    it('should fetch a stored object', function(){
      return store.get(1)
      .then(function(data){
        expect(data.name).to.equal('John');
      });
    });

    it('should overwrite a given object', function(){
      var data = {
        name: 'James'
      };
      var id = 1;
      return store.put(id, data)
      .then(function(insertId){
        return store.get(id)
      })
      .then(function(data){
        expect(data.name).to.equal('James');
      });
    });

    it('should delete a given object', function(){
      store.remove(1)
      .then(function(result){
        return store.get(1);
      })
      .then(function(data){
        expect(data).to.not.exist;
      });
    });

    after(function(){
      return store.clear();
    });
  });

  describe('batch ops', function(){

    var store;
    var dataArray = [
      {
        id: 1,
        name: 'John'
      },
      {
        id: 2,
        name: 'Joe'
      },
      {
        id: 3,
        name: 'James'
      }
    ];

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-simple'
      });
      return store.ready;
    });

    it('should store multiple objects', function(){
      return store.putBatch(dataArray)
      .then(function(result){
        expect(result).to.be.ok;
      });
    });

    it('should fetch multiple objects', function(){
      return store.getBatch([1,2,3])
      .then(function(data){
        expect(data[0].name).to.equal('John');
        expect(data[1].name).to.equal('Joe');
        expect(data[2].name).to.equal('James');
      });
    });

    it('should delete multiple objects', function(){
      return store.removeBatch([1,2])
      .then(function(result){
        expect(result).to.be.ok;
        return store.getAll()
      })
      .then(function(data){
        expect(data.length).to.equal(1);
        expect(data[0].name).to.equal('James');
      });
    });

    after(function(){
      return store.clear();
    });

  });

  describe('getBatch() dataArray return type', function(){

    var store;
    var dataArray = [
      {
        id: 1,
        name: 'John'
      },
      {
        id: 2,
        name: 'Joe'
      },
      {
        id: 3,
        name: 'James'
      }
    ];

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-simple'
      });
      return store.ready.then(function(){
        return store.putBatch(dataArray);
      });
    });

    it('should return a sparse array for arrayType="sparse"', function(){
      return store.getBatch([1,10,3], 'sparse')
      .then(function(data){
        expect(data.length).to.equal(3);

        expect(data[0].name).to.equal('John');
        expect(data[1]).to.not.exist;
        expect(data[2].name).to.equal('James');

        var forEachCount = 0;
        data.forEach(function(){
          forEachCount++;
        });
        expect(forEachCount).to.equal(2);
      });
    });

    it('should return a dense array for arrayType="dense"', function(){
      return store.getBatch([1,10,3], 'dense')
      .then(function(data){
        expect(data.length).to.equal(3);

        expect(data[0].name).to.equal('John');
        expect(data[1]).to.not.exist;
        expect(data[2].name).to.equal('James');

        var forEachCount = 0;
        data.forEach(function(){
          forEachCount++;
        });
        expect(forEachCount).to.equal(3);
      });
    });

    it('should return a reduced array for arrayType="skip"', function(){
      return store.getBatch([1,10,3], 'skip')
      .then(function(data){
        expect(data.length).to.equal(2);
        expect(data[0].name).to.equal('John');
        expect(data[1].name).to.equal('James');
      });
    });


    after(function(){
      return store.clear()
    });
  });

  describe('indexes', function(){
    var store;

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-indexes',
        indexes: [
          { name: 'basic', keyPath: 'name', unique: false, multiEntry: false },
          { name: 'deep', keyPath: 'address.email', unique: false, multiEntry: false },
          { name: 'date', keyPath: 'joined', unique: false, multiEntry: false },
          { name: 'compound', keyPath: ['name', 'age'], unique: false, multiEntry: false }
        ]
      })
      return store.ready;
    });

    it('should create all indexes', function(){
      var indexList = store.getIndexList();
      expect(indexList).to.respondTo('contains');
      expect(indexList.length).to.equal(4);
    });

    it('should store a well-formed object', function(){
      var data = {
        id: 1,
        name: 'John',
        lastname: 'Doe',
        age: 42,
        joined: new Date(),
        address: {
          email: 'j.doe@example.com',
          city: 'New Boston'
        }
      };
      return store.put(data)
      .then(function(insertId){
        expect(insertId).to.equal(data.id);
      });
    });

    after(function(){
      return store.clear();
    });

  });

  describe('queries', function(){

    var store;

    before(function(){
      store = new IDBStore({
        storeName: 'spec-store-indexes',
        indexes: [
          { name: 'basic', keyPath: 'name', unique: false, multiEntry: false },
          { name: 'deep', keyPath: 'address.email', unique: false, multiEntry: false },
          { name: 'date', keyPath: 'joined', unique: false, multiEntry: false },
          { name: 'compound', keyPath: ['name', 'age'], unique: false, multiEntry: false }
        ]
      });
      return store.ready.then(function(){
        var dataArray = [
          {
            id: 1,
            name: 'John',
            lastname: 'Doe',
            age: 42,
            joined: Date.parse('Aug 9, 1995'),
            address: {
              email: 'j.doe@example.com',
              city: 'New Boston'
            }
          },
          {
            id: 2,
            name: 'Joe',
            lastname: 'Doe',
            age: 35,
            joined: Date.parse('Sep 21, 2004'),
            address: {
              email: 'joe.doe@example.com',
              city: 'New Boston'
            }
          },
          {
            id: 3,
            name: 'James',
            lastname: 'Smith',
            age: 32,
            joined: Date.parse('Oct 10, 2010'),
            address: {
              email: 'j.smith@example.com',
              city: 'New York'
            }
          },
          {
            id: 4,
            name: 'Frank',
            lastname: 'Miller',
            age: 42,
            joined: Date.parse('Nov 27, 2001'),
            address: {
              email: 'f.miller@example.com',
              city: 'New York'
            }
          },
          {
            id: 5,
            name: 'Jenna',
            lastname: 'Doe',
            age: 43,
            joined: Date.parse('Jan 7, 2011'),
            address: {
              email: 'j.doe@example.com',
              city: 'New Boston'
            }
          },
          {
            id: 6,
            name: 'John',
            lastname: 'Smith',
            age: 47,
            joined: Date.parse('Feb 11, 2000'),
            address: {
              email: 'j.smith@example.com',
              city: 'New Boston'
            }
          }
        ];
        return store.putBatch(dataArray);
      });
    });

    it('should fetch objects using basic index (Keyrange.only)', function(){
      return store.query({
        index: 'basic',
        keyRange: store.makeKeyRange({
          only: 'John'
        })
      })
      .then(function(data){
        expect(data.length).to.equal(2);
      });
    });

    it('should fetch objects using basic index (Keyrange.lower)', function(){
      return store.query({
        index: 'basic',
        keyRange: store.makeKeyRange({
          lower: 'Jo'
        })
      })
      .then(function(data){
        expect(data.length).to.equal(3);
      });
    });

    it('should fetch objects using deep index (KeyRange.only)', function(){
      return store.query({
        index: 'deep',
        keyRange: store.makeKeyRange({
          only: 'j.doe@example.com'
        })
      })
      .then(function(data){
        expect(data.length).to.equal(2);
      });
    });

    it('should fetch objects using deep index (KeyRange.upper + exclude)', function(){
      return store.query({
        index: 'deep',
        keyRange: store.makeKeyRange({
          upper: 'j',
          excludeUppr: true
        })
      })
      .then(function(data){
        expect(data.length).to.equal(1);
      });
    });

    it('should fetch objects using date index (KeyRange.lower)', function(){
      return store.query({
        index: 'date',
        keyRange: store.makeKeyRange({
          lower: Date.parse('Jan 1, 2000')
        })
      })
      .then(function(data){
        expect(data.length).to.equal(5);
      });
    });

    it('should fetch objects using date index (KeyRange.upper)', function(){
      return store.query({
        index: 'date',
        keyRange: store.makeKeyRange({
          upper: Date.parse('Jan 1, 2005')
        })
      })
      .then(function(data){
        expect(data.length).to.equal(4);
      });

    });

    it('should fetch objects using date index (KeyRange.upper + lower)', function(){
      return store.query({
        index: 'date',
        keyRange: store.makeKeyRange({
          lower: Date.parse('Jan 1, 2000'),
          upper: Date.parse('Jan 1, 2005')
        })
      })
      .then(function(data){
        expect(data.length).to.equal(3);
      });
    });

    it('should fetch objects using compound index (KeyRange.only)', function(){
      return store.query({
        index: 'compound',
        keyRange: store.makeKeyRange({
          only: ['John', 42]
        })
      })
      .then(function(data){
        expect(data.length).to.equal(1);
      });
    });

    after(function(){
      return store.clear();
    });
  });

});
