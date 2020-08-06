import { manager, Model } from '../../../index'
import _ from 'lodash'
import { expect } from 'chai';
import { chats, messages, posts, todos, devices, users, spots, SpotModel, PostModel, PostList, ChatList, ChatModel, MessageModel, UserModel, UserList, specificUsers, UserSpecificModel, UserSpecificList, TodoModel } from './data'
import { notEqual } from 'assert';

const FULL_TESTING = false

const main = async () => {
    const MAIN_USERNAME = 'louis'
    const MAIN_ACCESS_TOKEN = '1f00714f-a7bf-4212-ac86-c34b3c7a823a'

    const SECOND_USERNAME = 'paul'
    const SECOND_ACCESS_TOKEN = 'cbd12084-4dac-4d9d-8962-59e37771ed04'

    it('Create Tables', async () => {
        await manager.init()
    })

    it('Try add in a global Collection', async () => {
        expect(() => users.local().push({username: 'fakeuser1', access_token: '5353415a-f997-4754-8a6f-15ef66fe25a3'})).to.throw(Error)
    })


    it('Test quick', async () => {
        const u1 = await specificUsers.quick().create({ username: 'fakeuser1', access_token: '5353415a-f997-4754-8a6f-15ef66fe25a3' }) as UserSpecificModel
        const u2 = await specificUsers.quick().create({ username: 'fakeuser2', access_token: 'b4bc464e-c165-11ea-b3de-0242ac130004' }) as UserSpecificModel
        const u3 = await specificUsers.quick().create({ username: 'fakeuser3', access_token: 'b925f9a0-c165-11ea-b3de-0242ac130004' }) as UserSpecificModel

        const count1 = await specificUsers.quick().count()
        const count2 = await specificUsers.quick().count({ id: u1.ID() })
        const count3 = await specificUsers.quick().count('id', u1.ID())
        const count4 = await specificUsers.quick().count('id', '<', u3.ID())
        
        expect((count1 as number - 2)).to.be.eq(count2).to.be.eq(count3).to.be.eq(count4 as number - 1).to.be.eq(1)

        const u1Fetched = await specificUsers.quick().find(u1.ID()) as UserSpecificModel
        const u2Fetched = await specificUsers.quick().find({id: u2.ID()}) as UserSpecificModel
        const u3Fetched = await specificUsers.quick().find('id', u3.ID()) as UserSpecificModel
        const u3BFetched = await specificUsers.quick().find('id', '=', u3.ID()) as UserSpecificModel

        expect(_.isEqual(u1Fetched.to().plain(), u1.to().plain())).to.eq(true)
        expect(_.isEqual(u2Fetched.to().plain(), u2.to().plain())).to.eq(true)
        expect(_.isEqual(u3Fetched.to().plain(), u3.to().plain())).to.eq(true)
        expect(_.isEqual(u3BFetched.to().plain(), u3.to().plain())).to.eq(true)
        
        const allCreated = specificUsers.ctx()
        allCreated.local().append(u1, u2, u3)

        const allPulled = await specificUsers.ctx().quick().pull().run()
        expect(_.isEqual(allCreated.local().to().plain(), allPulled.local().to().plain())).to.eq(true)

        const pullFirst = await specificUsers.ctx().sql().pull().where({id: u1.ID()}).run() as UserSpecificList
        const pullSecond = await specificUsers.ctx().quick().pull('id', u2.ID()).run() as UserSpecificList
        const pullThree = await specificUsers.ctx().quick().pull('id', '<=', u3.ID()).run()

        expect(pullFirst.local().count()).to.eq(1).to.eq(pullSecond.local().count())
        expect((pullFirst.local().nodeAt(0) as UserSpecificModel).accessToken()).to.eq(u1.accessToken())
        expect((pullSecond.local().nodeAt(0) as UserSpecificModel).accessToken()).to.eq(u2.accessToken())
        expect(_.isEqual(allCreated.local().to().plain(), pullThree.local().to().plain())).to.eq(true)
        
        await specificUsers.quick().update({'username': 'fantasim'}, {'id': u1.ID()})
        const u1reFetched = await specificUsers.quick().find(u1.ID()) as UserSpecificModel
        expect(u1reFetched.username()).to.eq('fantasim')

        await specificUsers.quick().update({'username': 'skily'}, 'id', u2.ID())
        const u2reFetched = await specificUsers.quick().find(u2.ID()) as UserSpecificModel
        expect(u2reFetched.username()).to.eq('skily')

        await specificUsers.quick().update({'username': 'arponpon'}, 'id', '=', u3.ID())
        const u3reFetched = await specificUsers.quick().find(u3.ID()) as UserSpecificModel
        expect(u3reFetched.username()).to.eq('arponpon')

        const now = new Date()
        now.setMilliseconds(0)
        await specificUsers.quick().update({created_at: now})
        const allPulled2 = await specificUsers.ctx().quick().pull().run() as UserSpecificList
        for (let i = 0; i < allPulled2.local().count(); i++){
            const m = allPulled2.local().nodeAt(i) as UserSpecificModel
            expect(_.isEqual(m.createdAt(), now))
        }
        await specificUsers.quick().remove(u1.ID())
        await specificUsers.quick().remove(u2.ID())
        await specificUsers.quick().remove(u3.ID())

        const countTotal = await specificUsers.quick().count()
        expect(countTotal).to.eq(0)
    })

    it('Create an user', async () => {
        const u = await users.fetchByUsername(MAIN_USERNAME)
        if (!u){
            try {
                await users.quick().create({ username: MAIN_USERNAME, access_token: MAIN_ACCESS_TOKEN })
            } catch (e){
                console.log(e)
            }
            const list = await users.ctx().sql().pull().all().run()
            expect(list.local().count()).to.eq(1)    
        }
    })

    it('Connect a device', async () => {
        const u = await users.fetchByToken(MAIN_ACCESS_TOKEN)
        expect(u).to.not.eq(null)
        if ( (await u.countDevices()) == 0){
            await devices.quick().create({user: u.ID()})
            const list = await devices.ctx().quick().pull().run()
            expect(list.local().count()).to.eq(1)            
        }
    })

    it('Check User/Device', async () => {
        const u = await users.fetchByUsername(MAIN_USERNAME)
        expect(u).to.not.eq(null)
        const deviceList = await u.fetchDevices()
        expect(deviceList.local().count()).to.eq(1)
        const firstPlain = deviceList.local().first()?.to().plain()
        expect(firstPlain.user.username).to.eq(MAIN_USERNAME)
        expect(firstPlain.user.access_token).to.eq(MAIN_ACCESS_TOKEN)
    })

    it('Create 2 spots', async () => {
        const u = await users.fetchByUsername(MAIN_USERNAME)
        expect(u).to.not.eq(null)
        if ((await u.countOwnedSpot()) < 2){
            await spots.quick().create({ name: 'Bitcoin', user: u.ID() })
            await spots.quick().create({ name: 'Ethereum', user: u.ID(), description: 'This is a spot for the ethereum community.' })
            const list = await spots.ctx().quick().pull().run()
            expect(list.local().count()).to.eq(2)
        }
    })

    it('Check Spots', async () => {
        const u = await users.fetchByUsername(MAIN_USERNAME)
        expect(u).to.not.eq(null)
        const spotList = await u.fetchSpots()
        expect(spotList.local().count()).to.eq(2)
        const first = spotList.local().first() as SpotModel
        const snd = spotList.local().nodeAt(1) as SpotModel
        expect(first.name() === 'Bitcoin')
        expect(snd.name() === 'Ethereum')
        expect(first.user().username() === MAIN_USERNAME)
        expect(snd.user().username() === MAIN_USERNAME)
    })

    it('Create 4 posts', async () => {
        const u = await users.fetchByUsername(MAIN_USERNAME)
        expect(u).to.not.eq(null)
        const spotList = await u.fetchSpots()
        expect(spotList.local().count()).to.eq(2)
        if ((await u.countAllPosts()) == 0){
            await posts.ctx().local().append(
                {
                    content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
                    user: u.ID(),
                    spot: (spotList.local().nodeAt(0) as SpotModel).ID()
                },
                {
                    content: "La méthode concat() est utilisée afin de fusionner un ou plusieurs tableaux en les concaténant. Cette méthode ne modifie pas les tableaux existants, elle renvoie un nouveau tableau qui est le résultat de l'opération.",
                    user: u.ID(),
                    spot: (spotList.local().nodeAt(0) as SpotModel).ID()
                },
                {
                    content: "Sets a distinct clause on the query. If the parameter is falsy or empty array, method falls back to '*'.",
                    user: u.ID(),
                    spot: (spotList.local().nodeAt(1) as SpotModel).ID()
                },
                {
                    content: "Encapsulate your states inside Models and Collections to treat, access, format, and organize your data in a one and same place.",
                    user: u.ID(),
                    spot: (spotList.local().nodeAt(1) as SpotModel).ID()
                }
            ).saveToDB()
            const total = await u.countAllPosts()
            expect(total).to.eq(4)
        }
    })
    

    it('Check Posts', async () => {
        const u = await users.fetchByToken(MAIN_ACCESS_TOKEN)
        expect(u).to.not.eq(null)
        const postList = await u.fetchPosts()
        postList.local().map((post: PostModel) => expect(post.user().accessToken()).to.eq(MAIN_ACCESS_TOKEN))
        expect('Bitcoin').to.eq( (postList.local().nodeAt(0) as PostModel).spot().name() ).to.eq( (postList.local().nodeAt(1) as PostModel).spot().name() )
        expect('Ethereum').to.eq( (postList.local().nodeAt(2) as PostModel).spot().name() ).to.eq( (postList.local().nodeAt(3) as PostModel).spot().name() )

        const spotsList = await u.fetchSpots() 
        for (let i = 0; i < spotsList.local().count(); i++){
            const s = spotsList.local().nodeAt(i) as SpotModel
            const postList = await s.fetchPosts()
            expect(postList.local().count()).to.eq(2)            
        }
    })


    it('Add/Update/Delete Post', async () => {
        const u = await users.fetchByToken(MAIN_ACCESS_TOKEN)
        expect(u).to.not.eq(null)
        const localPosts = posts.ctx() as PostList
        const p = await localPosts.quick().create({
            content: "Il n'y a qu'une loi qui vaille: la force",
            user: u.ID(),
            spot: 1
        }) as PostModel

        let newPost = (await posts.quick().find(p.ID())) as PostModel
        expect(_.isEqual(p.to().plain(), newPost.to().plain())).to.equal(true)
        expect(p.spot().name()).to.eq('Bitcoin')
        await p.setState({ spot: 2 }).saveToDB()
        newPost = (await posts.sql().find().byPrimary(p.ID())) as PostModel
        expect(newPost.spot().name()).to.eq('Ethereum')

        await localPosts.sql().node(p).delete()
        newPost = (await posts.sql().find().byPrimary(p.ID())) as PostModel
        expect(newPost).to.equal(null)
    })

    it('Create a 2nd user', async () => {
        const u = await users.fetchByUsername(SECOND_USERNAME)
        if (!u){
            try {
                await users.quick().create({ username: SECOND_USERNAME, access_token: SECOND_ACCESS_TOKEN })
            } catch (e){
                console.log(e)
            }
            const list = await users.ctx().sql().pull().all().run()
            expect(list.local().count()).to.eq(2)    
        }
    })

    it('Connect device with 2nd user', async () => {
        const u = await users.fetchByToken(SECOND_ACCESS_TOKEN)
        expect(u).to.not.eq(null)
        if ((await u.countDevices()) == 0){
            await devices.quick().create({user: u.ID()})
            const list = await devices.ctx().sql().pull().all().run()
            expect(list.local().count()).to.eq(2)
        }
    })

    it('Check 2nd User/Device', async () => {
        const u = await users.fetchByUsername(SECOND_USERNAME)
        expect(u).to.not.eq(null)
        const deviceList = await u.fetchDevices()
        expect(deviceList.local().count()).to.eq(1)
        const firstPlain = deviceList.local().first()?.to().plain()
        expect(firstPlain.user.username).to.eq(SECOND_USERNAME)
        expect(firstPlain.user.access_token).to.eq(SECOND_ACCESS_TOKEN)
    })

    it('Add 1st message', async () => {
        const MESSAGE_CONTENT = 'this is our first message ever!'
        
        const u1 = await users.fetchByUsername(MAIN_USERNAME)
        expect(u1).to.not.eq(null)
        const u2 = await users.fetchByUsername(SECOND_USERNAME)
        expect(u2).to.not.eq(null)

        const list = await chats.pullWithUsers(u1.ID(), u2.ID())
        let chat: ChatModel;
        if (list.local().count() === 0)
            chat = await chats.quick().create({user_1: u1.ID(), user_2: u2.ID()}) as ChatModel
        else 
            chat = list.local().first() as ChatModel
        let listMessage = await chat.pullAllMessage()
        if (listMessage.local().count() == 0){
            const msg = await messages.quick().create({
                content: MESSAGE_CONTENT,
                user: u1.ID(),
                chat: chat.ID()
            }) as MessageModel
            await chat.setState({ last_message: msg }).saveToDB()
            expect(msg.user().ID()).to.equal(u1.ID())
            expect(chat.to().plainUnpopulated().last_message).to.equal(1)
        }
    })

    it('Test filtering group', async () => {
        const u1 = await users.fetchByUsername(MAIN_USERNAME)
        expect(u1).to.not.eq(null)
        const u2 = await users.fetchByUsername(SECOND_USERNAME)
        expect(u2).to.not.eq(null)

        const chat = await chats.fetchWithUsers(u1.ID(), u2.ID())
        const messages = await chat.pullAllMessage()
        const messagesPlainFiltered = messages.local().to().filterGroup().plain()
        expect(messagesPlainFiltered[0].user.access_token).to.eq(undefined)
        expect(messagesPlainFiltered[0].user.username).to.not.eq(undefined)
    })

    it('Test pull: offset/limit', async () => {
        const list = await posts.quick().pull().limit(3).run()
        expect(list.local().count()).to.eq(3)
        const list2 = await posts.quick().pull().offset(2).limit(3).run()
        expect(list2.local().count()).to.eq(2)
    })

    it('Test pull: orderBy', async () => {
        const list = await posts.quick().pull().orderBy('id', 'desc').limit(1).run()
        const node = list.local().nodeAt(0)
        expect(list.local().count()).to.equal(1)
        expect(node?.state.id).to.eq(4)
    })

    if (FULL_TESTING){
        it('Add 50 messages in 1 package', async () => {
            const u1 = await users.fetchByUsername(MAIN_USERNAME)
            expect(u1).to.not.eq(null)
            const u2 = await users.fetchByUsername(SECOND_USERNAME)
            expect(u2).to.not.eq(null)

            const chat = await chats.fetchWithUsers(u1.ID(), u2.ID())
            expect(chat).to.not.eq(null)
            const msgList = messages.ctx()
            for (let i = 0; i < 50; i++){
                await msgList.local().push({
                    content: `AUTOMATIC MESSAGE CONTENT n: ${i}`,
                    user: Math.round(Math.random()) == 0 ? u1.ID() : u2.ID(),
                    chat: chat.ID()
                }).saveToDB()
            }
        })
    }

    if (FULL_TESTING){
        it('Add 10 messages in 10 packages', async () => {
            const u1 = await users.fetchByUsername(MAIN_USERNAME)
            expect(u1).to.not.eq(null)
            const u2 = await users.fetchByUsername(SECOND_USERNAME)
            expect(u2).to.not.eq(null)

            const chat = await chats.fetchWithUsers(u1.ID(), u2.ID())
            expect(chat).to.not.eq(null)
            const msgList = messages.ctx()
            for (let i = 0; i < 50; i++){
                await msgList.local().push({
                    content: `AUTOMATIC MESSAGE CONTENT n: ${i}`,
                    user: Math.round(Math.random()) == 0 ? u1.ID() : u2.ID(),
                    chat: chat.ID()
                }).saveToDB()
            }
        })
    }

}


main()