from pprint import pprint
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db.models.manager import Manager
import inject
from kernel.authentication.models import Account

class BaseRepository(object):

    mapper = Manager

    def __init__(self, data=None, id=None, **kwargs):
        """
        Sets up the repository
        :param id:
        :param kwargs:
        :return:
        """
#        print "kwargs:"
#        pprint(kwargs)
        if data:
            self._raw_data = data
#            print "raw data:"
#            pprint(self._raw_data)
            if not id and 'id' in self._raw_data:
                id = self._raw_data.get('id')

        self._filter_kwargs = kwargs.pop('filter_kwargs') if 'filter_kwargs' in kwargs else {}

        self._filter_args = kwargs.pop('filter_args') if 'filter_args' in kwargs else []

        self._id = id

        self._messages = {}


    def init_data(self, data=None):
        """
        Make the data all perty, nicey, happy!
        :param data:
        :return:
        """
        raise ImplementationRequiredException('init_data', self.__class__)

    @property
    def data(self):
        data = getattr(self, '_data', False) or self.init_data()._data
        return data

    @data.setter
    def data(self, data):
        self._raw_data = data
        self.init_data()

    @data.deleter
    def data(self):
        self.clear_data()

    @property
    def messages(self):
#        print "%s messages: " % self.__class__.__name__
#        pprint(self._messages)
        return self._messages

    @messages.setter
    def messages(self, messages):
        self._messages = messages

    @messages.deleter
    def messages(self):
        self._messages = {}

    def clear_data(self):
        try:
            del self._raw_data
            del self._data
        except AttributeError:
            pass
        return self

    def data_is_valid(self):
        return False if self.init_data().messages.get('errors') else True

    def get(self, id=None):
        try:
            return self.mapper.get(id=(id or self._id))
        except (MultipleObjectsReturned, ObjectDoesNotExist):
            pass
            
        return None


    def all(self):
        return self.mapper.all()

    def filter(self, *args, **kwargs):
        filter_args = self._filter_args + args
        filter_kwargs = self._filter_kwargs
        filter_kwargs.update(kwargs)

        return self.mapper.filter(*filter_args, **filter_kwargs)

    def clear_filters(self):
        self._filter_args = []
        self._filter_kwargs = {}
        return self


    def save(self):
        """
        Save the aggregate root and dependents
        """
        raise ImplementationRequiredException('save', self.__class__)

    

class AccountLimitedRepository(BaseRepository):
    account = inject.attr(Account)

    def filter(self, *args, **kwargs):
        filter_kwargs = {'account': self.account}
        kwargs.update(filter_kwargs)
        return super(AccountLimitedRepository, self).filter(*args, **kwargs)

class RepositoryWithUserMixin(object):
    user = inject.attr(User)

class BaseFactory(object):

    @classmethod
    def create(cls, data=None):
        """
        Defines the one required method of a factory
        :param cls:
        :param data:
        :return aggregate root:
        """
        raise ImplementationRequiredException('create', cls)

class ImplementationRequiredException(BaseException):

    def __init__(self, method=None, cls=None, *args, **kwargs):
        self.method = method
        self.cls = cls
        super(ImplementationRequiredException, self).__init__(*args, **kwargs)


    def __unicode__(self):
        return u"'%s' must be defined in a descendant of %s" % (self.method, self.cls.__name__)

    def __str__(self):
        return unicode(self).encode('utf-8')

