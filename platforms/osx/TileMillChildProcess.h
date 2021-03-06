
#import <Foundation/Foundation.h>

@class TileMillChildProcess;

@protocol TileMillChildProcessDelegate

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output;

- (void)childProcessDidStart:(TileMillChildProcess *)process;

- (void)childProcessDidFinish:(TileMillChildProcess *)process;

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;

@end


@interface TileMillChildProcess : NSObject {
    NSTask *task;
    id <TileMillChildProcessDelegate> delegate;
    NSString *basePath;
    NSString *command;
    bool launched;
}

@property (nonatomic, assign) id <TileMillChildProcessDelegate> delegate;

- (id)initWithBasePath:(NSString *)basePath command:(NSString *)command;

- (void) startProcess;

- (void) stopProcess;

@end
